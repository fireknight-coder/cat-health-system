// 宠物交流记录 API
import request from '@/api/request'

export interface PetChatMessage {
  _id: string
  adoptionId: string
  catId: string
  senderId: string
  senderName: string
  senderRole: 'user' | 'admin' | 'superadmin'
  content: string
  type: 'general' | 'health' | 'status' | 'intervention'
  isImportant: boolean
  createdAt: string
  updatedAt: string
}

// 获取某只宠物的交流记录
export function getPetChatMessages(catId: string) {
  return request.get<{ messages: PetChatMessage[] }>(`/pet-chat/${catId}`)
}

// 发送交流消息
export function sendPetChatMessage(data: {
  catId: string
  content: string
  type?: string
  isImportant?: boolean
}) {
  return request.post<{ message: PetChatMessage }>('/pet-chat', data)
}

// 标记消息为重要（仅管理员）
export function markPetChatImportant(id: string, isImportant: boolean) {
  return request.patch<{ message: PetChatMessage }>(`/pet-chat/${id}/important`, { isImportant })
}

// 删除消息
export function deletePetChatMessage(id: string) {
  return request.delete(`/pet-chat/${id}`)
}
