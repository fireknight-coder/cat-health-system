import fs from 'fs'
import path from 'path'
import multer from 'multer'

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function createStorage(folder) {
  const root = path.resolve('backend', 'uploads', folder)
  ensureDir(root)
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, root),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg'
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm']
      const safeExt = allowed.includes(ext) ? ext : '.jpg'
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
    }
  })
}

function imageOnlyFilter(_req, file, cb) {
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    cb(new Error('仅支持图片文件'))
    return
  }
  cb(null, true)
}

function imageOrVideoFilter(_req, file, cb) {
  if (!file.mimetype || (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('video/'))) {
    cb(new Error('仅支持图片或视频文件'))
    return
  }
  cb(null, true)
}

export const reportUpload = multer({
  storage: createStorage('reports'),
  fileFilter: imageOnlyFilter,
  limits: { files: 6, fileSize: 5 * 1024 * 1024 }
})

export const catUpload = multer({
  storage: createStorage('cats'),
  fileFilter: imageOnlyFilter,
  limits: { files: 10, fileSize: 6 * 1024 * 1024 }
})

export const communityUpload = multer({
  storage: createStorage('community'),
  fileFilter: imageOrVideoFilter,
  limits: { files: 9, fileSize: 20 * 1024 * 1024 }
})
