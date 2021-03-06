(function() {
  var ImageItem, ImagePreloader, Plan, StoryInterface;

  ImageItem = (function() {
    function ImageItem(source, loaded) {
      this.source = source;
      this.loaded = loaded != null ? loaded : false;
    }

    ImageItem.prototype.load = function(loadedCallback) {
      var newImage, that;
      if (this.source != null) {
        newImage = $('img[preloading-image][src="' + this.source + '"]');
        if (newImage.length > 0) {
          this.loaded = true;
          return loadedCallback();
        } else {
          $('body').append('<img preloading-image src="' + this.source + '" />');
          newImage = $('img[preloading-image][src="' + this.source + '"]').first();
          that = this;
          return newImage.load(function() {
            that.loaded = true;
            return loadedCallback();
          });
        }
      } else {
        this.loaded = true;
        return loadedCallback();
      }
    };

    return ImageItem;

  })();

  Plan = (function() {
    function Plan(plan_id) {
      this.plan_id = plan_id;
      this.imageItems = [];
      this.imageNumberTotal = 0;
      this.ready = false;
    }

    Plan.prototype.addImage = function(imageItem) {
      this.imageItems.push(imageItem);
      return this.imageNumberTotal++;
    };

    Plan.prototype.loadAllImages = function(allLoadedCallback) {
      var i, that, _i, _len, _ref, _results;
      that = this;
      if (this.imageItems.length > 0) {
        _ref = this.imageItems;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(i.load(function() {
            if (that.checkLoaded()) {
              return allLoadedCallback();
            }
          }));
        }
        return _results;
      } else {
        if (that.checkLoaded()) {
          return allLoadedCallback();
        }
      }
    };

    Plan.prototype.checkLoaded = function() {
      var i, loaded, _i, _len, _ref;
      loaded = true;
      if (this.imageItems.length > 0) {
        _ref = this.imageItems;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          if (!i.loaded) {
            loaded = false;
          }
        }
      } else {
        loaded = true;
      }
      this.ready = loaded;
      return loaded;
    };

    return Plan;

  })();

  ImagePreloader = (function() {
    function ImagePreloader() {
      this.plans = {};
      this.plansInOrder = [];
      this.imageNumberTotal = 0;
      this.imageNumberLoaded = 0;
      this.waitingPlan = -1;
    }

    ImagePreloader.prototype.addPlan = function(plan) {
      this.plans[plan.plan_id] = plan;
      this.plansInOrder.push(plan);
      return this.imageNumberTotal += plan.imageNumberTotal;
    };

    ImagePreloader.prototype.calculateAllImageTotal = function() {
      var p, result, _i, _len, _ref;
      result = 0;
      _ref = this.plans;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        result += p.imageNumberTotal;
      }
      return result;
    };

    ImagePreloader.prototype.isPlanReady = function(plan_id) {
      if ((plan_id != null) && (this.plans[plan_id] != null)) {
        return this.plans[plan_id].ready;
      }
    };

    ImagePreloader.prototype.loadPlanImages = function(plan_id, callback) {
      var that;
      if ((plan_id != null) && (this.plans[plan_id] != null)) {
        that = this;
        return this.plans[plan_id].loadAllImages(function() {
          return callback();
        });
      }
    };

    ImagePreloader.prototype.waitPlanLoaded = function(plan_id, callback) {
      var interval, that;
      that = this;
      interval = setInterval(function() {
        if (that.isPlanReady(plan_id)) {
          callback();
          return clearInterval(interval);
        }
      });
      return 1;
    };

    return ImagePreloader;

  })();

  StoryInterface = (function() {
    function StoryInterface(domElement, firstPlan_id) {
      this.domElement = domElement;
      this.firstPlan_id = firstPlan_id;
      this.imagePreloader = new ImagePreloader();
      this.initPlans();
      this.bindButtons();
      this.bindRatioWH();
      this.preloadPlan(this.firstPlan_id);
      this.startPlanEvents = {};
      this.startPlanAllEvents = function() {};
      this.stopPlanEvents = {};
      this.stopPlanAllEvents = function() {};
    }

    StoryInterface.prototype.initPlans = function() {
      var that;
      that = this;
      return this.domElement.find('.plan[plan-id]').each(function() {
        var plan, plan_id;
        plan_id = $(this).attr('plan-id');
        plan = {};
        if (plan_id != null) {
          plan = new Plan(plan_id);
          $(this).find('[image-src-preload]').each(function() {
            var imageItem, imageUrl;
            imageUrl = $(this).attr('image-src-preload');
            if (imageUrl != null) {
              imageItem = new ImageItem(imageUrl, false);
              return plan.addImage(imageItem);
            }
          });
          return that.imagePreloader.addPlan(plan);
        }
      });
    };

    StoryInterface.prototype.preloadPlan = function(plan_id) {
      var that;
      that = this;
      return this.imagePreloader.loadPlanImages(plan_id, function() {
        return that.domElement.find("[goto-plan=\"" + plan_id + "\"]").attr('ready', 1);
      });
    };

    StoryInterface.prototype.goToPlan = function(plan_id) {
      if (plan_id != null) {
        if (this.imagePreloader.isPlanReady(plan_id)) {
          this.endAllActivePlans();
          return this.startPlan(plan_id);
        }
      }
    };

    StoryInterface.prototype.getAllFollowingPlans = function(plan_id) {
      var plansToGo, that;
      if (plan_id != null) {
        plansToGo = this.domElement.find('.plan[plan-id="' + plan_id + '"]').find('[goto-plan]');
        if (plansToGo.length > 0) {
          that = this;
          return $(plansToGo).each(function() {
            var followPlanId;
            followPlanId = $(this).attr('goto-plan');
            if (followPlanId != null) {
              return that.preloadPlan(followPlanId);
            }
          });
        }
      }
    };

    StoryInterface.prototype.bindRatioWH = function() {
      var ratioWH, that;
      that = this;
      ratioWH = this.domElement.attr('ratio-wh');
      if (ratioWH != null) {
        ratioWH = parseFloat(ratioWH);
        if (ratioWH > 0) {
          that = this;
          $(window).resize(function() {
            return that.resizeFrame(ratioWH);
          });
          return this.resizeFrame(ratioWH);
        }
      }
    };

    StoryInterface.prototype.resizeFrame = function(ratioWH) {
      var width;
      width = this.domElement.width();
      if (width != null) {
        return this.domElement.height(width / ratioWH);
      }
    };

    StoryInterface.prototype.bindButtons = function() {
      var that;
      that = this;
      return this.domElement.find('[goto-plan]').click(function() {
        var plan;
        plan = $(this);
        if (plan != null) {
          return that.goToPlan(plan.attr('goto-plan'));
        }
      });
    };

    StoryInterface.prototype.endAllActivePlans = function() {
      return this.domElement.find('.plan.start').removeClass('start').addClass('stop');
    };

    StoryInterface.prototype.startPlan = function(plan_id) {
      var currentPlan;
      if (plan_id != null) {
        this.domElement.find('.plan[plan-id="' + plan_id + '"]').removeClass('stop').addClass('start');
        currentPlan = this.getCurrentPlan();
        if (currentPlan !== plan_id) {
          this.startPlanEvent(plan_id);
        }
        if (currentPlan != null) {
          this.stopPlanEvent(currentPlan);
        }
        this.setCurrentPlan(plan_id);
        return this.getAllFollowingPlans(plan_id);
      }
    };

    StoryInterface.prototype.setCurrentPlan = function(plan_id) {
      if (plan_id != null) {
        return this.domElement.attr('current-plan-id', plan_id);
      }
    };

    StoryInterface.prototype.startStory = function() {
      if (this.firstPlan_id != null) {
        return this.startPlan(this.firstPlan_id);
      }
    };

    StoryInterface.prototype.onStartPlan = function(plan_id, callback) {
      if ((plan_id != null) && (callback != null)) {
        return this.startPlanEvents[plan_id] = callback;
      }
    };

    StoryInterface.prototype.onStartAllPlans = function(callback) {
      if (callback != null) {
        return this.startPlanAllEvents = callback;
      }
    };

    StoryInterface.prototype.onStopPlan = function(plan_id, callback) {
      if ((plan_id != null) && (callback != null)) {
        return this.stopPlanEvents[plan_id] = callback;
      }
    };

    StoryInterface.prototype.onStopAllPlans = function(callback) {
      if (callback != null) {
        return this.stopPlanAllEvents = callback;
      }
    };

    StoryInterface.prototype.startPlanEvent = function(plan_id) {
      if (this.startPlanAllEvents != null) {
        this.startPlanAllEvents();
      }
      if (this.startPlanEvents[plan_id] != null) {
        return this.startPlanEvents[plan_id]();
      }
    };

    StoryInterface.prototype.stopPlanEvent = function(plan_id) {
      if (this.stopPlanAllEvents != null) {
        this.stopPlanAllEvents();
      }
      if (this.stopPlanEvents[plan_id] != null) {
        return this.stopPlanEvents[plan_id]();
      }
    };

    StoryInterface.prototype.getCurrentPlan = function() {
      return this.domElement.attr('current-plan-id');
    };

    return StoryInterface;

  })();

  window.StoryInterface = StoryInterface;

}).call(this);
