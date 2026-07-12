import { _get } from '../server/request';

// 字典项列表（按 typeCode 过滤）
export function listDictItems(typeCode) {
  return _get({
    url: `/api/wechat/dict/items`,
    data: { typeCode },
  });
}
