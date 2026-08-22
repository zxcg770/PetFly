import api from './axios';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export async function getConversations() {
  try {
    const response = await api.get('/messages/conversations');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load conversations'));
  }
}

export async function getMessages(conversationId) {
  try {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load messages'));
  }
}

export async function sendMessage(conversationId, message) {
  try {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, message);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not send message'));
  }
}

export async function deleteConversation(conversationId) {
  try {
    const response = await api.delete(`/messages/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not delete conversation'));
  }
}

export async function markConversationRead(conversationId) {
  try {
    const response = await api.patch(`/messages/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not mark messages as read'));
  }
}

export async function createConversation(transportRequestId) {
  try {
    const response = await api.post('/messages/conversations', { transportRequestId });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not create conversation'));
  }
}
