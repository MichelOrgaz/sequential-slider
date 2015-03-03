

  #so to sum it up, in your class definition:
  # @nose: or @nose = defines a static (class) variable/function
  # nose: defines a prototype variable/function
  # nose= defines a private variable/function

  #in your constructor:
  # nose= defines a private variable for an instance of the class
  # @nose= defines an ‘instance’ variable for an instance of the class

  # containts the source URL and the loaded status
  class ImageItem
    constructor: (@source, @loaded = false) ->
    load: (loadedCallback) ->
      if @source?
        # Check if the image <img> doen't exist
        newImage = $('img[preloading-image][src="' + @source + '"]')
        if newImage.length > 0
          @loaded = true
          loadedCallback()
        else
          $('body').append('<img preloading-image src="' + @source + '" />')
          newImage = $('img[preloading-image][src="' + @source + '"]').first()
          that = @
          newImage.load ->
            #if not that.isLoaded
            that.loaded = true
            loadedCallback()
      else
        @loaded = true
        loadedCallback()

  class Plan
    constructor: (@plan_id) ->
      @imageItems = []
      @imageNumberTotal = 0
      @ready = false
    addImage: (imageItem) ->
      @imageItems.push(imageItem)
      @imageNumberTotal++
    loadAllImages: (allLoadedCallback) ->
      that = @
      if @imageItems.length > 0
        for i in @imageItems
          i.load ->
            if that.checkLoaded()
              allLoadedCallback()
      else  allLoadedCallback() if that.checkLoaded()
    checkLoaded: ->
      loaded = true
      if @imageItems.length > 0
        for i in @imageItems
          loaded = false if not i.loaded
      else
        loaded = true
      @ready = loaded
      loaded

  class ImagePreloader
    constructor: ->
      # plan instances object [plan_id] = plan
      @plans = {}
      #plan instance objects in order in an array
      @plansInOrder = []
      @imageNumberTotal = 0
      @imageNumberLoaded = 0
      @waitingPlan = -1
    addPlan: (plan) ->
      @plans[plan.plan_id] = plan
      @plansInOrder.push(plan)
      @imageNumberTotal += plan.imageNumberTotal
    calculateAllImageTotal: ->
      result = 0
      for p in @plans
        result += p.imageNumberTotal
      result
    isPlanReady: (plan_id) ->
      if plan_id? && @plans[plan_id]?
        @plans[plan_id].ready
    loadPlanImages: (plan_id, callback) ->
      if plan_id? && @plans[plan_id]?
        that = @
        @plans[plan_id].loadAllImages ->
          callback()
    waitPlanLoaded: (plan_id, callback) ->
      that = @
      interval = setInterval ->
        if that.isPlanReady(plan_id)
          callback()
          clearInterval(interval)
      1

  class StoryInterface
    constructor: (@domElement, @firstPlan_id) ->
      @imagePreloader = new ImagePreloader()
      @initImagePreloader()
      @bindButtons()
      @bindRatioWH()
      @preloadPlan(@firstPlan_id)
      @startPlanEvents = {}
      @startPlanAllEvents= ->
      @stopPlanEvents = {}
      @stopPlanAllEvents = ->
    # init all images and plans to preload
    initImagePreloader: ->
      # get all plans
      that = @
      @domElement.find('.plan[plan-id]').each ->
        plan_id = $(@).attr('plan-id')
        plan = {}
        if plan_id?
          plan = new Plan(plan_id)
          # get all items to preload
          $(@).find('[image-src-preload]').each ->
            imageUrl = $(@).attr('image-src-preload')
            if imageUrl?
              imageItem = new ImageItem(imageUrl, false)
              plan.addImage(imageItem)
          that.imagePreloader.addPlan(plan)
    preloadPlan: (plan_id) ->
      that = @
      @imagePreloader.loadPlanImages plan_id, ->
        that.domElement.find("[goto-plan=\"#{plan_id}\"]").attr('ready',1)
    goToPlan: (plan_id) ->
      if plan_id?
        if @imagePreloader.isPlanReady(plan_id)
          @endAllActivePlans()
          @startPlan(plan_id)
        #@imagePreloader.waitPlanLoaded plan_id, ->
        #	if @planToGo == plan_id
        #		that.endAllActivePlans()
        #		that.startPlan(plan_id)

    # return the list of the following plans into a plan
    getAllFollowingPlans: (plan_id) ->
      if plan_id?
        plansToGo = @domElement.find('.plan[plan-id="' + plan_id + '"]').find('[goto-plan]')
        if plansToGo.length > 0
          that = @
          $(plansToGo).each ->
            followPlanId = $(@).attr('goto-plan')
            that.preloadPlan(followPlanId) if followPlanId?
    bindRatioWH: ->
      that = @
      ratioWH = @domElement.attr('ratio-wh')
      if ratioWH?
        ratioWH = parseFloat(ratioWH)
        if ratioWH > 0
          that = @
          $(window).resize ->
            that.resizeFrame(ratioWH)
          @resizeFrame(ratioWH)
    resizeFrame: (ratioWH) ->
      width = @domElement.width()
      if width?
        @domElement.height(width/ratioWH)

    bindButtons: ->
      that = @
      @domElement.find('[goto-plan]').click ->
        plan = $(@)
        that.goToPlan(plan.attr('goto-plan')) if plan?
    endAllActivePlans: ->
      @domElement.find('.plan.start').removeClass('start').addClass('stop')
    startPlan: (plan_id) ->
      if plan_id?
        @domElement.find('.plan[plan-id="' + plan_id + '"]').removeClass('stop').addClass('start')
        currentPlan = @getCurrentPlan()
        @startPlanEvent(plan_id) if currentPlan != plan_id
        @stopPlanEvent(currentPlan) if currentPlan?
        @setCurrentPlan(plan_id)
        @getAllFollowingPlans(plan_id)
    setCurrentPlan: (plan_id) ->
      if plan_id?
        @domElement.attr('current-plan-id', plan_id)
    # public ---
    startStory: ->
      @startPlan(@firstPlan_id) if @firstPlan_id?
    # onChangePlan : set a callback event to a plan changing. If the method is called without callback function, the callback is called
    onStartPlan: (plan_id, callback) ->
      @startPlanEvents[plan_id] = callback if plan_id? && callback?
    onStartAllPlans: (callback) ->
      @startPlanAllEvents = callback if callback?
    onStopPlan: (plan_id, callback) ->
      @stopPlanEvents[plan_id] = callback if plan_id? && callback?
    onStopAllPlans: (callback) ->
      @stopPlanAllEvents = callback if callback?
    startPlanEvent: (plan_id) ->
      # for all plans
      @startPlanAllEvents() if @startPlanAllEvents?
      # for the plan id
      @startPlanEvents[plan_id]() if @startPlanEvents[plan_id]?
    stopPlanEvent: (plan_id) ->
      # for all plans
      @stopPlanAllEvents() if @stopPlanAllEvents?
      # for the plan id
      @stopPlanEvents[plan_id]() if @stopPlanEvents[plan_id]?
    getCurrentPlan: ->
      @domElement.attr('current-plan-id')

  # link to window global
  window.StoryInterface = StoryInterface