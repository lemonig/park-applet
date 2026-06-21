import {
  _post,
  _get,
  _upload
} from "../server/request";


// 市场列表（后端为 GET，参数：pageNum/pageSize/type/parkingNo/status）
export function listMarket(data) {
  return _get({
    url: `/api/market/list`,
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
// 详情（后端为 GET，路径变量 /detail/{id}）
export function detailMarket(id) {
  return _get({
    url: `/api/market/detail/${id}`
  })
}