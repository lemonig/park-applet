import { _get } from '../server/request';

// 小区列表（仅启用；带 lat/lng 时按距离升序返回）
export function listCommunities(data) {
  return _get({
    url: `/api/wechat/community/list`,
    data,
  });
}
