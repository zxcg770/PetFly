import api from './axios';

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || error.message || fallback;
}

export async function getMyProfile() {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load profile'));
  }
}

export async function getPublicProfile(userId) {
  try {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not load profile'));
  }
}

export async function updateMyProfile(profile) {
  try {
    const response = await api.put('/users/profile', profile);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not update profile'));
  }
}

export async function uploadMyProfilePhoto(file) {
  try {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const response = await api.post('/users/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Could not upload profile photo'));
  }
}
