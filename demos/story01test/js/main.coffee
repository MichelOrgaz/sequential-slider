$(document).ready ->

  $('.story').each ->

    story = new StoryInterface($(@), 'p00')

    # !test! d'event au changement de plan
    #story.onStopPlan 'plan001', ->
    #  $('html head title').html 'plan 001'
    #  console.log 'fin plan 001'


    #story.onStartAllPlans ->
    #  console.log 'start plan (all event)'

    #story.onStopAllPlans ->
    #  console.log 'stop plan (all event)'

    #story.onStartPlan 'plan002', ->
    #  $('html head title').html 'plan 002'

    #story.onStopPlan 'plan002', ->
    #  console.log 'fin plan 002'


    $(@).find('.plan[plan-id]').each ->
      #flowtype
      $(@).flowtype(fontRatio : 30)

    story.startStory()