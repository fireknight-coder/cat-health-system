import express from 'express'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { catUpload } from '../middleware/upload.js'

const router = express.Router()

const PROJECT_ROOT = process.cwd()
const CAT_REID_ROOT = path.resolve(PROJECT_ROOT, '..', 'cat_p_v', 'cat101')
const PYTHON_SCRIPT = path.join(CAT_REID_ROOT, 'cat_reid_prototype.py')
const PROTOTYPE_SAVE_DIR = path.join(CAT_REID_ROOT, 'cat_prototypes')
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'D:\\miniconda3\\python.exe'
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.bmp', '.webp', '.JPG', '.JPEG', '.PNG'])
const PREFERRED_FIRST_IMAGE = /^1\s*\(1\)\.(jpg|jpeg|png|bmp|webp)$/i

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function getFirstCatImage(catId) {
  if (!catId) return null

  const catDir = path.join(CAT_REID_ROOT, catId)
  if (!fs.existsSync(catDir)) return null

  const imageFiles = fs.readdirSync(catDir)
    .filter((name) => IMAGE_EXTS.has(path.extname(name)))

  const preferredImage = imageFiles.find((name) => PREFERRED_FIRST_IMAGE.test(name))
  const firstImage = preferredImage || imageFiles.sort((a, b) => a.localeCompare(b, 'en')).at(0)
  if (!firstImage) return null

  return {
    fileName: firstImage,
    relativeUrl: `/api/cat-reid/matched-image/${encodeURIComponent(catId)}`,
  }
}

function resolveMatchedCatImagePath(catId) {
  if (!catId) return null

  const catDir = path.join(CAT_REID_ROOT, String(catId).trim())
  if (!fs.existsSync(catDir)) return null

  const imageFiles = fs.readdirSync(catDir)
    .filter((name) => IMAGE_EXTS.has(path.extname(name)))

  const preferredImage = imageFiles.find((name) => PREFERRED_FIRST_IMAGE.test(name))
  const firstImage = preferredImage || imageFiles.sort((a, b) => a.localeCompare(b, 'en')).at(0)
  if (!firstImage) return null

  return path.join(catDir, firstImage)
}

function parsePythonOutput(stdout) {
  const bestCatMatch = stdout.match(/最高相似猫ID\s*:\s*([^\r\n]+)/)
  const bestScoreMatch = stdout.match(/最高相似度\s*:\s*([0-9.]+)/)
  const thresholdMatch = stdout.match(/建议阈值\s*:\s*([0-9.]+)/)
  const decisionMatch = stdout.match(/最终判定\s*:\s*([^\r\n]+)/)

  const rawDecision = decisionMatch?.[1]?.trim()
  if (!rawDecision) {
    throw new Error(`Unable to parse Python output: ${stdout}`)
  }

  const isOldCat = rawDecision.includes('已知猫')

  return {
    decision: isOldCat ? 'old_cat' : 'new_cat',
    label: isOldCat ? '判定为老猫' : '判定为新猫',
    bestCatId: bestCatMatch?.[1]?.trim() || undefined,
    score: bestScoreMatch?.[1] ? Number(bestScoreMatch[1]) : undefined,
    threshold: thresholdMatch?.[1] ? Number(thresholdMatch[1]) : undefined,
    rawDecision,
  }
}

function runCatReid(imagePath) {
  return new Promise((resolve, reject) => {
    const psCommand = [
      '&',
      quotePowerShell(PYTHON_EXECUTABLE),
      quotePowerShell(PYTHON_SCRIPT),
      "'--root_dir'",
      quotePowerShell(CAT_REID_ROOT),
      "'--query'",
      quotePowerShell(imagePath),
      "'--save_dir'",
      quotePowerShell(PROTOTYPE_SAVE_DIR),
    ].join(' ')

    console.log('[cat-reid] received image, start python')
    console.log(`[cat-reid] python executable: ${PYTHON_EXECUTABLE}`)
    console.log(`[cat-reid] python script: ${PYTHON_SCRIPT}`)
    console.log(`[cat-reid] image path: ${imagePath}`)
    console.log(`[cat-reid] powershell command: ${psCommand}`)

    const child = exec(
      `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psCommand.replace(/"/g, '\\"')}"`,
      {
        cwd: CAT_REID_ROOT,
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8',
          PYTHONUNBUFFERED: '1',
        },
        windowsHide: true,
        maxBuffer: 20 * 1024 * 1024,
      },
    )

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout += text
      process.stdout.write(`[cat-reid stdout] ${text}`)
    })

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text
      process.stderr.write(`[cat-reid stderr] ${text}`)
    })

    child.on('error', (error) => {
      console.error('[cat-reid] failed to start python:', error)
      reject(error)
    })

    child.on('close', (code) => {
      console.log(`[cat-reid] python exited with code ${code}`)

      if (code !== 0) {
        reject(new Error(stderr || stdout || `Python exited with code ${code}`))
        return
      }

      try {
        const parsed = parsePythonOutput(stdout)
        console.log('[cat-reid] parsed result:', parsed)
        resolve(parsed)
      } catch (error) {
        reject(error)
      }
    })
  })
}

router.get('/matched-image/:catId', (req, res) => {
  try {
    const imagePath = resolveMatchedCatImagePath(req.params.catId)
    if (!imagePath) {
      return res.status(404).json({ error: 'Matched cat image not found' })
    }

    res.sendFile(imagePath)
  } catch (error) {
    console.error('matched cat image failed:', error)
    res.status(500).json({ error: error.message || 'Failed to load matched cat image' })
  }
})

router.post('/identify', authenticateToken, requireAdmin, catUpload.single('image'), async (req, res) => {
  try {
    console.log('[cat-reid] /identify request received')

    if (!req.file) {
      return res.status(400).json({
        decision: 'new_cat',
        label: '请先上传图片',
        error: 'No uploaded image was received',
      })
    }

    const result = await runCatReid(req.file.path)
    const matchedCatImage = getFirstCatImage(result.bestCatId)

    res.json({
      ...result,
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/cats/${req.file.filename}`,
      matchedCatImageUrl: matchedCatImage ? `${req.protocol}://${req.get('host')}${matchedCatImage.relativeUrl}` : undefined,
      matchedCatImageName: matchedCatImage?.fileName,
    })
  } catch (error) {
    console.error('cat reid failed:', error)
    res.status(500).json({
      decision: 'new_cat',
      label: '识别失败',
      error: error.message || 'Cat re-identification failed',
    })
  }
})

export default router
