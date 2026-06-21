import { listMarket } from '../../api/market';

const PAGE_SIZE = 10;
const PLACEHOLDER_IMG = 'https://tdesign.gtimg.com/miniprogram/images/example1.png';

Page({
  data: {
    titleProps: {
      title: '首页',
    },
    keyword: '',
    pageNum: 1,
    pageData: [],
    total: 0,
    loading: false,
    isAllData: false,
  },

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

    const params = {
      pageNum,
      pageSize: PAGE_SIZE,
    };
    if (this.data.keyword) {
      params.parkingNo = this.data.keyword;
    }

    try {
      const res = await listMarket(params);
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

  // 搜索框输入变化
  onSearchChange(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 触发搜索
  onSearch() {
    this.fetchData(true);
  },

  // 卡片/预订点击：跳转详情
  onBook(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/carport-detail/index?id=${id}`,
    });
  },

  onLoad() {
    this.fetchData(true);
  },

  onShow() {
    this.fetchData(true);
    this.getTabBar().init();
  },

  onPullDownRefresh() {
    this.fetchData(true);
  },

  onReachBottom() {
    this.fetchData(false);
  },

  onShareAppMessage() {},
});
