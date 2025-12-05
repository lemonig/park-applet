import {
  _post,
  _upload
} from "../server/request";


// 车位列表 
export function listCarport(data) {
  return _post({
    url: `/api/carport/list`,
    method: 'post',
    data
  })
}
// 添加 
export function addCarport(data) {
  return _post({
    url: `/api/carport/add`,
    method: 'post',
    data
  })
}
// 更新 
export function updateCarport(data) {
  return _post({
    url: `/api/carport/update`,
    method: 'post',
    data
  })
}
// 删除 
export function deleteCarport(data) {
  return _post({
    url: `/api/carport/delete`,
    method: 'post',
    data
  })
}
// 删除 
export function detailCarport(data) {
  return _post({
    url: `/api/carport/detail`,
    method: 'post',
    data
  })
}