const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';

/**
 * Resolves media URLs (Cloudinary CDN, local server uploads, or relative assets)
 * so they load consistently in the browser without CORS or host mismatches.
 */
export function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // If it points to the local backend port 5000, align host with current window location
    if (typeof window !== 'undefined' && url.includes(':5000/media/')) {
      return url.replace(/https?:\/\/[^/]+:5000/, `http://${window.location.hostname}:5000`);
    }
    return url;
  }
  // Relative media paths such as "media/images/healthy_food.png" or "/media/..."
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:5000/${cleanPath}`;
}

/**
 * Returns Authorization headers using stored JWT token.
 * For FormData / multipart requests, does NOT set Content-Type header so the browser sets the boundary correctly.
 */
function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem('ownx_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

export async function loginUser(username, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Ensure backend is running (run_backend.bat).`);
    }
    throw err;
  }
}

export async function registerUser(username, password, extraData = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, ...extraData })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Ensure backend is running (run_backend.bat).`);
    }
    throw err;
  }
}

export async function fetchCurrentUser() {
  const token = localStorage.getItem('ownx_token');
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: 'GET',
    headers: getAuthHeaders(false)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to authenticate user session.');
  }
  return res.json();
}

export async function fetchUserProfile(userId) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`);
  if (!res.ok) {
    throw new Error('Failed to load user profile.');
  }
  return res.json();
}

export async function updateUserProfile(userId, profileData) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(false),
    body: JSON.stringify(profileData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Unable to update profile. Please try again.');
  }
  return data;
}

/**
 * Uploads profile photo to Cloudinary via authenticated multipart/form-data request
 */
export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${API_BASE_URL}/api/users/profile/photo`, {
    method: 'PUT',
    headers: getAuthHeaders(true), // Let browser set multipart boundary
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload profile photo to Cloudinary.');
  }
  return data;
}

export async function fetchPosts() {
  const res = await fetch(`${API_BASE_URL}/api/posts`);
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  return res.json();
}

export async function fetchUserPosts(userId) {
  const res = await fetch(`${API_BASE_URL}/api/posts/user/${userId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch user posts');
  }
  return res.json();
}

/**
 * Creates a post on the backend.
 * Supports multipart FormData (with 'media' file for Cloudinary upload)
 * or JSON payload for text-only posts.
 */
export async function createPost(postData) {
  const isMultipart = postData instanceof FormData;
  const headers = getAuthHeaders(isMultipart);

  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers,
    body: isMultipart ? postData : JSON.stringify(postData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Unable to create post. Please try again.');
  }
  return data;
}

export async function fetchPostComments(postId) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function createComment(postId, content) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ content })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to publish comment');
  }
  return data;
}

export async function followUser(userId, followerUserId) {
  const res = await fetch(`${API_BASE_URL}/api/followers/follow`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ user_id: userId, follower_user_id: followerUserId })
  });
  return res.json();
}

export async function fetchFollowers(userId) {
  const res = await fetch(`${API_BASE_URL}/api/followers/${userId}`);
  if (!res.ok) return [];
  return res.json();
}
