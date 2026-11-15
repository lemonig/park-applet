import { listFavorites, removeFavorite } from '../../api/favorite';

const PAGE_SIZE = 10;
const PLACEHOLDER_IMG = 'https://tdesign.gtimg.com/miniprogram/images/example1.png';

Page({
  data: {
    titleProps: {
      title: '我的收藏',
    },
    pageNum: 1,
    pageData: [],
    total: 0,
    loading: false,
    isAllData: false,
  },

  // 派生字段与首页一致；收藏列表服务端只返回在售（status=1），故恒 available
  formatItem(item) {
    const images = item.images || [];
    return {
      ...item,
      imageUrl: images.length ? images[0].url : PLACEHOLDER_IMG,
      typeText: item.type === 1 ? '出售' : '出租',
      unit: item.type === 1 ? '元' : '元/月',
      available: item.status === 1,
      statusText: item.status === 1 ? '在售' : item.status === 0 ? '待审核' : '已下架',
    };
  },

  fetchData: async function (reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.isAllData) return;

    const pageNum = reset ? 1 : this.data.pageNum;
    this.setData({ loading: true });

    try {
      const res = await listFavorites({ pageNum, pageSize: PAGE_SIZE });
      const list = (res.data || []).map((item) => this.formatItem(item));
      const total = res.page ? res.page.total : 0;
      const pageData = reset ? list : this.data.pageData.concat(list);

      this.setData({
        pageData,
        total,
        pageNum: pageNum + 1,
        isAllData: pageData.length >= total,
        loading: false,
      });
    } catch (err) {
      this.setData({ loading: false });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  // 取消收藏：先移出列表再调接口，失败则整列表重拉兜底
  onRemove: async function (e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.pageData[index];
    if (!item) return;

    this.setData({
      pageData: this.data.pageData.filter((_, i) => i !== index),
      total: Math.max(this.data.total - 1, 0),
    });

    try {
      await removeFavorite(item.id);
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
      this.fetchData(true);
    }
  },

  // 卡片/查看点击：跳转详情
  onTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/carport-detail/index?id=${id}`,
    });
  },

  onLoad() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.redirectTo({ url: '/pages/login/index' }), 600);
      return;
    }
    this.fetchData(true);
  },

  onPullDownRefresh() {
    this.fetchData(true);
  },

  onReachBottom() {
    this.fetchData(false);
  },
});
