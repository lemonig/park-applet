import { _post, _get, _put, _delete } from '../server/request';

// 车位列表（仅已审核通过）
export function listMarket(data) {
  return _get({
    url: `/api/wechat/market/list`,
    data,
  });
}

// 我发布的车位
export function listMyMarket(data) {
  return _get({
    url: `/api/wechat/market/mine`,
    data,
  });
}

// 详情
export function detailMarket(id) {
  return _get({
    url: `/api/wechat/market/detail/${id}`,
  });
}

// 发布车位
export function addMarket(data) {
  return _post({
    url: `/api/wechat/market`,
    data,
  });
}

// 更新本人车位
export function updateMarket(id, data) {
  return _put({
    url: `/api/wechat/market/${id}`,
    data,
  });
}

// 撤回/删除本人车位
export function deletedMarket(id) {
  return _delete({
    url: `/api/wechat/market/${id}`,
  });
}
