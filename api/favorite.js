import { _post, _get, _delete } from '../server/request';

// 收藏车位（幂等，重复收藏不报错）
export function addFavorite(id) {
  return _post({
    url: `/api/wechat/favorite/${id}`,
    data: {},
  });
}

// 取消收藏（幂等，未收藏也返回成功）
export function removeFavorite(id) {
  return _delete({
    url: `/api/wechat/favorite/${id}`,
  });
}

// 我的收藏列表（仅含在售车位）
export function listFavorites(data) {
  return _get({
    url: `/api/wechat/favorite/list`,
    data,
  });
}

// 我收藏的车位ID集合（首页星标状态回显）
export function listFavoriteIds() {
  return _get({
    url: `/api/wechat/favorite/ids`,
  });
}
