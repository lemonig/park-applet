import { listMyMarket, deletedMarket } from '../../api/market';

const PLACEHOLDER_IMG = 'https://tdesign.gtimg.com/miniprogram/images/example1.png';
const PAGE_SIZE = 10;

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核', value: 0 },
  { key: 'approved', label: '已通过', value: 1 },
  { key: 'rejected', label: '已拒绝', value: 2 },
];

Page({
  data: {
    titleProps: {
      title: '我的发布',
    },
    tabs: STATUS_TABS,
    activeTab: 'all',
    pageNum: 1,
    pageData: [],
    total: 0,
    loading: false,
    isAllData: false,
  },

  formatItem(item) {
    const images = item.images || [];
    let statusText = '';
    let statusTheme = 'default';
    if (item.status === 0) { statusText = '待审核'; statusTheme = 'warning'; }
    else if (item.status === 1) { statusText = '已通过'; statusTheme = 'success'; }
    else if (item.status === 2) { statusText = '已拒绝'; statusTheme = 'danger'; }
    return {
      ...item,
      imageUrl: images.length ? images[0].url : PLACEHOLDER_IMG,
      typeText: item.type === 1 ? '出售' : '出租',
      unit: item.type === 1 ? '元' : '元/月',
      statusText,
      statusTheme,
      priceText: item.price != null ? String(item.price) : '-',
    };
  },

  async fetchData(reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.isAllData) return;

    const pageNum = reset ? 1 : this.data.pageNum;
    this.setData({ loading: true });

    const tab = STATUS_TABS.find((t) => t.key === this.data.activeTab);
    const params = { pageNum, pageSize: PAGE_SIZE };
    if (tab && tab.value !== undefined) {
      params.status = tab.value;
    }

    try {
      const res = await listMyMarket(params);
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

  onTabChange(e) {
    const value = e.detail && e.detail.value != null ? e.detail.value : (e.detail && e.detail.index != null ? this.data.tabs[e.detail.index].key : 'all');
    const activeTab = this.data.tabs.some((t) => t.key === value) ? value : 'all';
    if (activeTab === this.data.activeTab) return;
    this.setData({ activeTab, pageNum: 1, pageData: [], total: 0, isAllData: false });
    this.fetchData(true);
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/carport-detail/index?id=${id}` });
  },

  noop() {},

  onEdit(e) {
    const item = this.data.pageData[e.currentTarget.dataset.index];
    if (!item) return;
    wx.navigateTo({ url: `/pages/carport-form/index?type=${item.type}&id=${item.id}` });
  },

  onDelete(e) {
    const item = this.data.pageData[e.currentTarget.dataset.index];
    if (!item || !item.id) return;
    wx.showModal({
      title: '确认撤回？',
      content: `撤回后该车位将不再展示，确定继续吗？`,
      confirmText: '撤回',
      confirmColor: '#fa4126',
      success: async (r) => {
        if (!r.confirm) return;
        try {
          const res = await deletedMarket(item.id);
          if (res && res.success !== false) {
            wx.showToast({ title: '已撤回', icon: 'success' });
            this.fetchData(true);
          }
        } catch (err) {
          wx.showToast({ title: '撤回失败', icon: 'none' });
        }
      },
    });
  },

  onLoad() {
    this.fetchData(true);
  },

  onPullDownRefresh() {
    this.fetchData(true);
  },

  onReachBottom() {
    this.fetchData(false);
  },

  onShareAppMessage() {
    return {
      title: '车位租售平台',
      path: '/pages/home/index',
    };
  },
});
