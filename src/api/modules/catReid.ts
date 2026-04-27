import request from '@/api/request'

export interface CatReidResult {
  decision: 'new_cat' | 'old_cat'
  label: string
  bestCatId?: string
  score?: number
  threshold?: number
  imageUrl?: string
  matchedCatImageUrl?: string
  matchedCatImageName?: string
}

export async function identifyCatImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)
  const response = await request.post('/cat-reid/identify', formData, {
    timeout: 120000,
  })
  return (response as unknown) as CatReidResult
}
