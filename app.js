App({
  onLaunch: function() {
    console.log('变身躲猫猫 启动');
    var sysInfo = tt.getSystemInfoSync();
    this.globalData.screenWidth = sysInfo.screenWidth || 375;
    this.globalData.screenHeight = sysInfo.screenHeight || 667;
  },
  globalData: {
    screenWidth: 375,
    screenHeight: 667,
  }
});
