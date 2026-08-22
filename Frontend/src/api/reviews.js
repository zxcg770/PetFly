import api from './axios';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export async function createReview(offerId, review) {
  try {
    const response = await api.post(`/reviews/offers/${offerId}`, review);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not create review'));
  }
}

export async function getReviewStatus(offerId) {
  try {
    const response = await api.get(`/reviews/offers/${offerId}/status`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not check review status'));
  }
}

export async function getTravelerReviews(travelerId) {
  try {
    const response = await api.get(`/reviews/travelers/${travelerId}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load traveler reviews'));
  }
}
