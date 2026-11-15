import { listMarket } from '../../api/market';
import { listFavoriteIds, addFavorite, removeFavorite } from '../../api/favorite';

const app = getApp();
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
    showHeaderSearch: false,
    lastScrollTop: 0,
    navBarHeight: app.globalData.navBarHeight || 0,
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
      favorited: this.favoriteIds ? this.favoriteIds.has(item.id) : false,
    };
  },

  fetchData: async function (reset = false) {
    if (this.data.loading) return;
    if (!reset && this.data.isAllData) return;

    const pageNum = reset ? 1 : this.data.pageNum;
    this.setData({ loading: true });

    // 星标状态与列表解耦：登录态下拉一次 ids，返回后统一回填
    if (reset) {
      this.fetchFavoriteIds();
    }

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

  // 拉取收藏 id 集合（未登录直接置空，接口 401 由请求层静默重登兜底）
  fetchFavoriteIds: async function () {
    if (!wx.getStorageSync('token')) {
      this.favoriteIds = new Set();
      return;
    }
    try {
      const res = await listFavoriteIds();
      if (res && res.success !== false && Array.isArray(res.data)) {
        this.favoriteIds = new Set(res.data);
        this.applyFavoriteState();
      }
    } catch (err) {
      // 星标回显失败不影响列表
    }
  },

  // 用最新收藏集合回填已渲染列表的星标状态
  applyFavoriteState() {
    const pageData = this.data.pageData.map((item) => ({
      ...item,
      favorited: this.favoriteIds.has(item.id),
    }));
    this.setData({ pageData });
  },

  // 收藏/取消收藏：乐观更新，失败回滚
  onToggleFavorite: async function (e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.pageData[index];
    if (!item) return;

    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '登录后即可收藏', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/index' }), 600);
      return;
    }

    const next = !item.favorited;
    this.setData({ [`pageData[${index}].favorited`]: next });
    if (next) {
      this.favoriteIds.add(item.id);
    } else {
      this.favoriteIds.delete(item.id);
    }

    try {
      if (next) {
        await addFavorite(item.id);
        wx.showToast({ title: '已收藏', icon: 'none' });
      } else {
        await removeFavorite(item.id);
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      }
    } catch (err) {
      // 接口失败：回滚 UI 与本地集合
      this.setData({ [`pageData[${index}].favorited`]: !next });
      if (next) {
        this.favoriteIds.delete(item.id);
      } else {
        this.favoriteIds.add(item.id);
      }
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

  onActionTap(e) {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateTo({ url: '/pages/login/index' }), 600);
      return;
    }
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/carport-form/index?type=${type}`,
    });
  },

  // 卡片/预订点击：跳转详情
  onBook(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/carport-detail/index?id=${id}`,
    });
  },

  onLoad() {
    this.favoriteIds = new Set();
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

  onPageScroll(e) {
    const scrollTop = e.scrollTop || 0;
    const lastScrollTop = this.data.lastScrollTop;
    const diff = scrollTop - lastScrollTop;

    if (Math.abs(diff) < 8) return;

    const showHeaderSearch = diff < 0 && scrollTop > this.data.navBarHeight;
    if (showHeaderSearch !== this.data.showHeaderSearch) {
      this.setData({ showHeaderSearch, lastScrollTop: scrollTop });
      return;
    }

    this.setData({ lastScrollTop: scrollTop });
  },

  onShareAppMessage() {},
});
