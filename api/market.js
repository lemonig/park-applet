import {
  _post,
  _upload
} from "../server/request";


// 市场列表 
export function listMarket(data) {
  return _post({
    url: `/api/market/list`,
    method: 'post',
    data
  })
}
// 删除 
export function deletedMarket(data) {
  return _post({
    url: `/api/market/delete`,
    method: 'post',
    data
  })
}
// 添加 
export function addMarket(data) {
  return _post({
    url: `/api/market/add`,
    method: 'post',
    data
  })
}
// 更新 
export function updateMarket(data) {
  return _post({
    url: `/api/market/update`,
    method: 'post',
    data
  })
}
// 详情 
export function detailMarket(data) {
  return _post({
    url: `/api/market/detail`,
    method: 'post',
    data
  })
}