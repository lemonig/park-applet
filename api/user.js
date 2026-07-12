import { _post, _get, _put } from '../server/request';

// 微信小程序静默登录 / 续期
export function wxLogin(data) {
  return _post({
    url: `/api/wechat/auth/mini-login`,
    data,
  });
}

// 兼容旧调用：账号密码登录（小程序目前未使用）
export function login(data) {
  return _post({
    url: `/api/wechat/auth/mini-login`,
    data,
  });
}

// 登出
export function logout() {
  return _post({
    url: `/api/wechat/auth/logout`,
    data: {},
  });
}

// 当前登录用户资料
export function detail() {
  return _get({
    url: `/api/wechat/user/profile`,
  });
}

// 更新当前登录用户资料
export function update(data) {
  return _put({
    url: `/api/wechat/user/profile`,
    data,
  });
}
