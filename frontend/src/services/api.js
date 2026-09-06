const API_BASE_URL = 'http://localhost:5000';

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
  const res = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function registerUser(username, password, location_id = 1) {
  const res = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, location_id })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
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

export async function createPost(postData) {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  const data = await res.json();
  if (!res.ok) {
    const errorObj = new Error(data.error || 'Failed to create post');
    errorObj.moderation = data.moderation;
    throw errorObj;
  }
  return data;
}

export async function fetchPostComments(postId) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`);
  if (!res.ok) return [];
  return res.json();
}

export async function createComment(postId, username, content) {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, content })
  });
  const data = await res.json();
  if (!res.ok) {
    const errorObj = new Error(data.error || 'Failed to publish comment');
    errorObj.moderation = data.moderation;
    throw errorObj;
  }
  return data;
}

export async function followUser(userId, followerUserId) {
  const res = await fetch(`${API_BASE_URL}/api/followers/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, follower_user_id: followerUserId })
  });
  return res.json();
}

export async function fetchFollowers(userId) {
  const res = await fetch(`${API_BASE_URL}/api/followers/${userId}`);
  if (!res.ok) return [];
  return res.json();
}
