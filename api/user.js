import {
  _post
} from "../server/request";

// 登录
export function login(data) {
  return _post({
    url: `/api/login`,
    data
  })
}

// 用户列表
export function list(data) {
  return _post({
    url: `/api/user/list`,
    method: 'post',
    data
  })
}

// 用户全部
export function all(data) {
  return _post({
    url: `/api/user/all`,
    method: 'post',
    data
  })
}

// 用户详情
export function detail(data) {
  return _post({
    url: `/api/user/detail`,
    data
  })
}

// 更新用户信息
export function update(data) {
  return _post({
    url: `/api/user/update`,
    data
  })
}

// 重置密码
export function resetPassword(data) {
  return _post({
    url: `/api/user/reset-password`,
    data
  })
}
