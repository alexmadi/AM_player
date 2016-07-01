first_start = true;
(function($){

    $.fn.Am_player = function(options) {
        
        var settings = {
           sprites_count : 0,
           sprite_step : 0,
        }; 

        return this.each(function() {
            // start inner code 

            var video_id = $(this).attr('id');
            var video_wrap_class = video_id + '_wrapper' ;           

            $(this).wrap("<div class='mediaplayer mediaplayer_normal_size mediaplayer_stopped'></div>");
            $(this).parent('.mediaplayer').wrap("<div class='player'></div>");

            $(this).closest('.player').addClass(video_wrap_class); 

            $(this).closest('.player').append(
                '<div class="control_panel">' +
                        '<div class="play_btn active_pause">'+
                            '<button class="play"></button> ' +
                            '<button class="pause"></button> ' +
                        '</div>' +
                        '<div class="time_slider">' +
                            '<input class="time-slider" id="time-slider" type="range" disabled value="0" step="any" "/>' +
                            '<div class="screen_tooltip"></div>'+
                        '</div>' +

                        '<div class="time_wrap">' +
                            '<span class="current-time">00:00</span>' +
                            '<span class="duration"></span>' +     
                        '</div>' +
                        '<div class="mute_btn">' +
                            '<input class="muted" type="checkbox" />' +
                            '<div class="ic_volume on ">' +
                             '<span class="ic_volume_arc_1"></span>'+
                             '<span class="ic_volume_arc_2"></span>' +
                             '<span class="ic_volume_arc_3"></span>'+ 
                             '<div class="ic_volume_rect"></div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="volume_slider">'+
                            '<input class="volume-slider" id="volume-slider" type="range" value="1" max="1" step="0.01" />' +
                        '</div>' +

                        '<div class="full_screen_btn">' +
                            '<input type="button" class="full_screen_input">' +
                        '</div>' +
                '</div>' 
            );
            // onchange="updateVolume(this.value);"
            ///  end wrapping


            if (window.webshim) {
                (function () {                    
                    webshim.setOptions('mediaelement', {
                        replaceUI: 'auto'
                    });
                    webshim.setOptions({types: 'range'});
                    webshim.setOptions('extendNative', true);
                    webshim.polyfill('mediaelement forms forms-ext');
                })();
            }

            //add some controls
            jQuery(function ($) {
                $('div.player').each(function () {
                    var player = this;
                    var getSetCurrentTime = createGetSetHandler(

                    function () {
                        $('input.time-slider', player).prop('value', $.prop(this, 'currentTime'));
                    }, function () {
                        try {
                            $('video, audio', player).prop('currentTime', $.prop(this, 'value'));
                        } catch (er) {}
                    });
                    var getSetVolume = createGetSetHandler(

                    function () {
                        $('input.volume-slider', player).prop('value', $.prop(this, 'volume'));

                    }, function () {
                        $('video, audio', player).prop('volume', $.prop(this, 'value'));
                    });
                    $('video, audio', this).bind('durationchange updateMediaState', function () {
                        var duration = $.prop(this, 'duration');
                        if (!duration) {
                            return;
                        }
                    
                        $('input.time-slider', player).prop({
                            'max': duration,
                            disabled: false
                        });            
                        var duration_time_parsed = parseInt(duration, 10); 
                        duration_time_final = SecondsTohhmmss(duration_time_parsed);
                        $('span.duration', player).text(duration_time_final);

                    }).bind('progress updateMediaState', function () {
                        var buffered = $.prop(this, 'buffered');
                        if (!buffered || !buffered.length) {
                            return;
                        }
                        buffered = getActiveTimeRange(buffered, $.prop(this, 'currentTime'));
                        $('span.progress', player).text(buffered[2]);
                    }).bind('timeupdate', function () {   
                        var curr_time = $.prop(this, 'currentTime')
                        var curr_time_parsed = parseInt(curr_time, 10); 
                        curr_time_final = SecondsTohhmmss(curr_time_parsed);
                        $('span.current-time', player).text(curr_time_final);

                    }).bind('timeupdate', getSetCurrentTime.get).bind('emptied', function () {
                        $('input.time-slider', player).prop('disabled', true);
                        $('span.duration', player).text('--');
                        $('span.current-time', player).text(0);
                        $('span.network-state', player).text(0);
                        $('span.ready-state', player).text(0);
                        $('span.paused-state', player).text($.prop(this, 'paused'));
                        $('span.height-width', player).text('-/-');
                        $('span.progress', player).text('0');
                    }).bind('waiting playing loadedmetadata updateMediaState', function () {
                        $('span.network-state', player).text($.prop(this, 'networkState'));
                        $('span.ready-state', player).text($.prop(this, 'readyState'));
                    }).bind('play pause', function () {
                        $('span.paused-state', player).text($.prop(this, 'paused'));
                    }).bind('volumechange', function () {
                        var muted = $.prop(this, 'muted');
                        $('span.muted-state', player).text(muted);
                        $('input.muted', player).prop('checked', muted);
                        $('span.volume', player).text($.prop(this, 'volume'));
                    }).bind('volumechange', getSetVolume.get).bind('play pause', function () {
                        $('span.paused-state', player).text($.prop(this, 'paused'));
                    }).bind('loadedmetadata updateMediaState', function () {
                        $('span.height-width', player).text($.prop(this, 'videoWidth') + '/' + $.prop(this, 'videoHeight'));
                    }).each(function () {
                        if ($.prop(this, 'readyState') > $.prop(this, 'HAVE_NOTHING')) {
                            $(this).triggerHandler('updateMediaState');
                        }
                    });

                    $('input.time-slider', player).bind('input', getSetCurrentTime.set).prop('value', 0);
                    $('input.volume-slider', player).bind('input', getSetVolume.set);

                    $('button.play', player).bind('click', function () {
                 
                        // $('.play_btn').removeClass('active_pause');
                        // $('.play_btn').addClass('active_play');
            
                        $(this).parent().removeClass('active_pause');
                        $(this).parent().addClass('active_play');

                        $('video, audio', player)[0].play();

                        $(this).closest('.mediaplayer').removeClass('mediaplayer_paused mediaplayer_stopped');
                        $(this).closest('.mediaplayer').addClass('mediaplayer_playing');

                        if ($.browser.mozilla) {  
                            $(this).removeClass('active');
                            $('.pause').addClass('active');
                        }
                    });
                    $('button.pause', player).bind('click', function () {
                        // $('.play_btn').removeClass('active_play');
                        // $('.play_btn').addClass('active_pause');
                        $(this).parent().removeClass('active_play');
                        $(this).parent().addClass('active_pause');

                        $('video, audio', player)[0].pause();
                        $(this).closest('.mediaplayer').removeClass('mediaplayer_playing');
                        $(this).closest('.mediaplayer').addClass('mediaplayer_paused');

                         if ($.browser.mozilla) {  
                            $(this).removeClass('active');
                            $('play').addClass('active');   
                        }
                    });        
 

                    $video_wrapper.click(function() { 
         
                       if ($.browser.mozilla) {
                            $("video").click(); 
                      
                            if (($('mediaplayer').hasClass('mediaplayer_paused')) && ($('mediaplayer').hasClass('mediaplayer_stopped'))) {
                                 $('.play').addClass('active');                   
                            }

                       }  

                        if ($(this).hasClass('mediaplayer_paused'))
                        {
                            $(this).addClass('mediaplayer_playing').removeClass('mediaplayer_paused  mediaplayer_stopped');
                            
                            $(this).closest('.player').find('.play_btn').removeClass('active_pause');
                            $(this).closest('.player').find('.play_btn').addClass('active_play');
                            $(this).find('video, audio', player)[0].play();       


                            if ($.browser.mozilla) {    

                                $('.pause').removeClass('active'); 
                                $('.play').addClass('active');
                                $('.play_btn').removeClass('active_play active_pause');

                            }
                        
                        } 
                        else if ($(this).hasClass('mediaplayer_stopped'))  {

                            $(this).find('video, audio', player)[0].play();
                            $(this).removeClass('mediaplayer_stopped');
                            $(this).addClass('mediaplayer_playing');             
                            
                            $(this).closest('.player').find('.play_btn').removeClass('active_pause');
                            $(this).closest('.player').find('.play_btn').addClass('active_play');
                
                  
                            if ($.browser.mozilla) {                    

                                $('.mediaplayer').removeClass('mediaplayer_paused');
                                $('.mediaplayer').addClass('mediaplayer_playing');    
                                $('.play_btn').addClass('active_play');                                      
                                $('.pause').addClass('active');       
                            }
                        }
                        else 
                        {
                            $(this).addClass('mediaplayer_paused').removeClass('mediaplayer_playing');
                            $(this).closest('.player').find('.play_btn').removeClass('active_play');
                            $(this).closest('.player').find('.play_btn').addClass('active_pause');
                            $(this).find('video, audio', player)[0].pause();              

                            if ($.browser.mozilla) {
                                $('.mediaplayer').removeClass('mediaplayer_paused');
                                $('.mediaplayer').addClass('mediaplayer_playing'); 
                                $('.play').removeClass('active');
                                $('.pause').addClass('active');     
                                $('video, audio', player)[0].pause();                
                            }                              
                        }                       
                    }); 

                    $('.full_screen_input').click(function() {
                      if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
                       (!document.mozFullScreen && !document.webkitIsFullScreen)) {
                        if (document.documentElement.requestFullScreen) {  
                          document.documentElement.requestFullScreen();  
                        } else if (document.documentElement.mozRequestFullScreen) {  
                          document.documentElement.mozRequestFullScreen();  
                        } else if (document.documentElement.webkitRequestFullScreen) {  
                          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
                        }  
                      } else {  
                        if (document.cancelFullScreen) {  
                          document.cancelFullScreen();  
                        } else if (document.mozCancelFullScreen) {  
                          document.mozCancelFullScreen();  
                        } else if (document.webkitCancelFullScreen) {  
                          document.webkitCancelFullScreen();  
                        }  
                      }  
                    });

                    $video_wrapper.dblclick(function() {
                      if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
                       (!document.mozFullScreen && !document.webkitIsFullScreen)) {
                        if (document.documentElement.requestFullScreen) {  
                          document.documentElement.requestFullScreen();  
                        } else if (document.documentElement.mozRequestFullScreen) {  
                          document.documentElement.mozRequestFullScreen();  
                        } else if (document.documentElement.webkitRequestFullScreen) {  
                          document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
                        }  
                      } else {  
                        if (document.cancelFullScreen) {  
                          document.cancelFullScreen();  
                        } else if (document.mozCancelFullScreen) {  
                          document.mozCancelFullScreen();  
                        } else if (document.webkitCancelFullScreen) {  
                          document.webkitCancelFullScreen();  
                        }  
                      }  
                    });

                    // $('.volume-slider').mousedown(function() {
                    //      $(this).attr("max",1);
                    //      $(this).attr("value",1);
                    //      $(this).val(1);                
                    // });

                    $('.volume-slider').change(function () {  
                     
                      val = $(this).val();  
                      $ic_volume = $(this).closest('.control_panel').find('.ic_volume');
                      if ((val < 0.66) && (val !== 0)) {
                      $ic_volume.addClass('v_66');
                      } else if (val >= 0.66) {
                      $ic_volume.removeClass('v_66');
                      } 
                      if ((val < 0.33) && (val !== 0)) {
                      $ic_volume.addClass('v_33');
                      } else if (val >= 0.33) {
                      $ic_volume.removeClass('v_33');
                      } 
                      if (val == 0) {
                      $ic_volume.removeClass('on v_33 v_66 ').addClass('mute');
                      } 
                      if ((val > 0) && ($ic_volume.hasClass('mute'))) {
                     $ic_volume.removeClass('mute').addClass('on');
                      }
                    }); 

                
                    if($.browser.chrome){
                        $(window).keypress(function (e) {
                            if (e.keyCode === 0 || e.keyCode === 32) {
                                e.preventDefault();   

                                 if (($('.mediaplayer').hasClass('mediaplayer_paused')) || ($('.mediaplayer').hasClass('mediaplayer_stopped'))) {                    
                                    $('video, audio', player)[0].play(); 
                                    $('.mediaplayer').removeClass('mediaplayer_stopped mediaplayer_paused');
                                    $('.mediaplayer').addClass('mediaplayer_playing');
                                    $('.play_btn').removeClass('active_pause');
                                    $('.play_btn').addClass('active_play');
                                    $('.control_panel').fadeOut(6000);             

                                } else if ($('.mediaplayer').hasClass('mediaplayer_playing')) {
                                    $('video, audio', player)[0].pause();
                                    $('.mediaplayer').removeClass('mediaplayer_playing');
                                    $('.mediaplayer').addClass('mediaplayer_paused');
                                    $('.control_panel').show(0);
                                }
                            }
                        }) 
                    }     
                    $(document).keyup(function(e) {
              
                      if (e.keyCode === 27) {
                        if ($am_player_container.hasClass('full_screen_on')) {
                            $am_player_container.removeClass('full_screen_on');             
                        }
                      }
                    });

                    $('input.muted', player).bind('click updatemuted', function () {
                        $('video, audio', player).prop('muted', $.prop(this, 'checked'));
                    }).triggerHandler('updatemuted');


                    $('input.controls', player).bind('click', function () {
                        $('video, audio', player).prop('controls', $.prop(this, 'checked'));
                    }).prop('checked', true);

                    $('select.load-media', player).bind('change', function () {
                        var srces = $('option:selected', this).data('src');
                        if (srces) {
                            //the following code can be also replaced by the following line
                            //$('video, audio', player).loadMediaSrc(srces).play();
                            $('video, audio', player).removeAttr('src').find('source').remove().end().each(function () {
                                var mediaElement = this;
                                if (typeof srces == 'string') {
                                    srces = [srces];
                                }
                                $.each(srces, function (i, src) {

                                    if (typeof src == 'string') {
                                        src = {
                                            src: src
                                        };
                                    }
                                    $(document.createElement('source')).attr(src).appendTo(mediaElement);
                                });
                            })[0].load();
                            $('video, audio', player)[0].play();
                        }
                    }).prop('selectedIndex', 0);
                });
            });

            //helper for createing throttled get/set functions (good to create time/volume-slider, which are used as getter and setter)

            function createGetSetHandler(get, set) {
                var throttleTimer;
                var blockedTimer;
                var blocked;
                return {
                    get: function () {
                        if (blocked) {
                            return;
                        }
                        return get.apply(this, arguments);
                    },
                    set: function () {
                        clearTimeout(throttleTimer);
                        clearTimeout(blockedTimer);

                        var that = this;
                        var args = arguments;
                        blocked = true;
                        throttleTimer = setTimeout(function () {
                            set.apply(that, args);
                            blockedTimer = setTimeout(function () {
                                blocked = false;
                            }, 30);
                        }, 0);
                    }
                };
            };

            function getActiveTimeRange(range, time) {
                var len = range.length;
                var index = -1;
                var start = 0;
                var end = 0;
                for (var i = 0; i < len; i++) {
                    if (time >= (start = range.start(i)) && time <= (end = range.end(i))) {
                        index = i;
                        break;
                    }
                }
                return [index, start, end];
            };


            // MINE CODE

          


            $(document).ready(function() {

                $(".ic_volume" ).click(function() {
                  $(this).toggleClass( "on mute" );
                });
                $('.muted').change(function() { 
                    var $check = $(this),
                        $div = $check.parent();
                    if ($check.prop('checked')) {
                        $(this).next().addClass('mute').removeClass('on');
                        
                        $volume_slider = $(this).closest('.control_panel').find('.volume-slider')
                        var curr_vol_val = $volume_slider.val();
                       
                      // console.log($(this));

                       $volume_slider.val(0);
                       $volume_slider.attr("value",0);
                       $volume_slider.attr("max",0);
                      

                    } else { 
                        $( this ).next().addClass('on').removeClass('mute');
                        $volume_slider.val(curr_vol_val);
                        $volume_slider.attr("value",curr_vol_val);
                        $volume_slider.attr("max",1);
                    } 
                });

              
                // $video_wrapper.dblclick(function() { 
                //     if ($(this).hasClass('mediaplayer_full'))
                //     {
                //         $(this).addClass('mediaplayer_normal_size').removeClass('mediaplayer_full');
                //         $am_player_container.removeClass('full_screen_on');
                //         $am_player_container.find('.full_screen_btn').removeClass('full_screen_on'); 
                //     }     
                //     else
                //     {
                //        $(this).addClass('mediaplayer_full').removeClass('mediaplayer_normal_size');
                //        $am_player_container.addClass('full_screen_on');
                //        $am_player_container.find('.full_screen_btn').addClass('full_screen_on'); 
                //     }
                // });

                console.log(first_start);
                if (first_start) {
                    $('.mediaplayer').dblclick(function(e) { 
                        if ($(this).hasClass('mediaplayer_full')) {
                            $(this).addClass('mediaplayer_normal_size').removeClass('mediaplayer_full');
                            $(this).parent().removeClass('full_screen_on');
                            $(this).parent().find('.full_screen_btn').removeClass('full_screen_on'); 
                            console.log('full_screen_off', e.target);
                        }     
                        else {
                           $(this).addClass('mediaplayer_full').removeClass('mediaplayer_normal_size');
                           $(this).parent().addClass('full_screen_on');
                           $(this).parent().find('.full_screen_btn').addClass('full_screen_on'); 

                            console.log('full_screen_on', e.target);
                        }
                    });
                    first_start=false; 
                }

                $am_player_container.find('.full_screen_input').click(function() {
                    console.log('test');
                    $am_player_container.toggleClass('full_screen_on');  
                    $video_wrapper.toggleClass('mediaplayer_normal_size mediaplayer_full'); 
                    $am_player_container.find('.full_screen_btn').toggleClass('full_screen_on');      
                });




                var time_slider_width = $('.time-slider').width();  
                var sprites_count = settings.sprites_count;
                var sprite_step = settings.sprite_step;

                var curr_step = 1;
                var one_part_time_x = time_slider_width/sprites_count;

                $am_player_container.find('.time-slider').on('mousemove', function (e) {

                   $am_player_container.find('.screen_tooltip').css('display','block');

                    offset_left = e.pageX;
                    var offset = $am_player_container.find( '.time-slider' ).offset().left; 
                                
                    var position_left = $am_player_container.find('.time-slider').offset().left;
                    var mouse_position = offset_left - position_left;                   
                    //var mouse_position_perc = ((mouse_position/time_slider_width)*100).toFixed(2) + '%';                  
                    var tooltip_width = $('.screen_tooltip').width();
                    var fixed_toolt_pos = ((offset + tooltip_width/2)*-1);
                    $am_player_container.find('.screen_tooltip').css({ 
                        'left' : offset_left,
                        'margin-left': fixed_toolt_pos
                    });
                    var curr_frame = Math.floor(mouse_position/one_part_time_x)+1;
                        
                    sprite_step_curr = sprite_step*(curr_frame-1); 

                    $am_player_container.find('.screen_tooltip').css({ 
                        "background-position-y" : -sprite_step_curr 
                    });    

                });

                $am_player_container.find(".time-slider").mouseleave(function() {
                    $(".screen_tooltip").hide();
                });

                $am_player_container.find(".time-slider").mouseenter(function() {
                    $(".screen_tooltip").show();
                });

                     
            });  // end docready



            var SecondsTohhmmss = function(totalSeconds) {
              var hours   = Math.floor(totalSeconds / 3600);
              var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
              var seconds = totalSeconds - (hours * 3600) - (minutes * 60);

              // round seconds
              seconds = Math.round(seconds * 100) / 100

              if (hours == 0) {
                 var result = (minutes < 10 ? "0" + minutes : minutes);
                 result += ":" + (seconds  < 10 ? "0" + seconds : seconds);
              return result;
              }
              if (hours > 0) {
                var result = (hours < 10 ? "0" + hours : hours);
                  result += ":" + (minutes < 10 ? "0" + minutes : minutes);
                  result += ":" + (seconds  < 10 ? "0" + seconds : seconds);
                return result;
              }
            } 
            

            var timedelay = 1;

            function delayCheck() {
                if(timedelay == 5) {
                    if ($video_wrapper.hasClass('mediaplayer_playing')) {
                        $am_player_container.find('.control_panel').fadeOut();
                    }
                    timedelay = 1;
                }
                timedelay = timedelay+1;
            }
                 
            $(document).mousemove(function() {
                $am_player_container.find('.control_panel').show(0);
                timedelay = 1;
                clearInterval(_delay);
                _delay = setInterval(delayCheck, 600);               
            });
            // page loads starts delay timer 
            _delay = setInterval(delayCheck, 600);

 
            // end inner code

            $am_player = $(this); 
            $video_wrapper = $am_player.parent(); // mediaplayer
            $am_player_container = $(this).closest('.player');
            //console.log($am_player);
            //console.log($am_player_container);

            if (options) {
               $.extend(settings, options);
            } 
        });
    };        
})(jQuery);

 
// function updateVolume(val) { 
//     document.getElementById('volume-slider').value=val; 

//     if ((val < 0.66) && (val !== 0)) {
//     $('.ic_volume').addClass('v_66');
//     } else if (val >= 0.66) {
//     $('.ic_volume').removeClass('v_66');
//     } 
//     if ((val < 0.33) && (val !== 0)) {
//     $('.ic_volume').addClass('v_33');
//     } else if (val >= 0.33) {
//     $('.ic_volume').removeClass('v_33');
//     } 
//     if (val == 0) {
//     $('.ic_volume').removeClass('on v_33 v_66 ').addClass('mute');
//     } 
//     if ((val > 0) && ($('.ic_volume').hasClass('mute'))) {
//     $('.ic_volume').removeClass('mute').addClass('on');
//     }
// } 



/*
usage

1.add class="am_player" to outer container
2.call Am_player

$('.slider_1').Am_player({
                     
}); 

*/



  // $('.volume-slider').onchange(function (val) {  
  //     document.getElementById('volume-slider').value=val; 
  //     if ((val < 0.66) && (val !== 0)) {
  //     $('.ic_volume').addClass('v_66');
  //     } else if (val >= 0.66) {
  //     $('.ic_volume').removeClass('v_66');
  //     } 
  //     if ((val < 0.33) && (val !== 0)) {
  //     $('.ic_volume').addClass('v_33');
  //     } else if (val >= 0.33) {
  //     $('.ic_volume').removeClass('v_33');
  //     } 
  //     if (val == 0) {
  //     $('.ic_volume').removeClass('on v_33 v_66 ').addClass('mute');
  //     } 
  //     if ((val > 0) && ($('.ic_volume').hasClass('mute'))) {
  //     $('.ic_volume').removeClass('mute').addClass('on');
  //     }
  // }); 


  $(document).ready(function() {
    box_size();
    
    $(window).resize(function() {
        box_size();
    });
    
    function box_size() {
        var player_width = $('.player').width();
     
        $('.player').removeClass('break_one').removeClass('break_two').removeClass('break_three');
        
        if (player_width > 1650) {
            $('.player').addClass('break_full');
        }
        if (player_width <= 1650 && player_width > 1030) {
            $('.player').addClass('break_one');
        }
        else if (player_width <= 1030 && player_width > 768) {
            $('.player').addClass('break_two');
        }
        else if (player_width <= 768) {
            $('.player').addClass('break_three');
        }
    }
}); 