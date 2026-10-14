function §\x04\x05§()
{
   set("\x03",2460 % 511 * 5);
   return eval("\x03");
}
var §\x01§ = -1818 + "\x04\x05"();
var _loc2_;
while(true)
{
   if(eval("\x01") == 262)
   {
      set("\x01",eval("\x01") + 256);
      §§push(true);
   }
   else if(eval("\x01") == 348)
   {
      set("\x01",eval("\x01") - 286);
   }
   else if(eval("\x01") == 62)
   {
      set("\x01",eval("\x01") + 862);
      §§push("\x0f");
      §§push(1);
   }
   else if(eval("\x01") == 530)
   {
      set("\x01",eval("\x01") - 8);
      §§push(!§§pop());
   }
   else if(eval("\x01") == 518)
   {
      set("\x01",eval("\x01") + 268);
      if(§§pop())
      {
         set("\x01",eval("\x01") - 438);
      }
   }
   else if(eval("\x01") == 193)
   {
      set("\x01",eval("\x01") + 337);
      §§push(eval(§§pop()));
   }
   else
   {
      if(eval("\x01") == 786)
      {
         set("\x01",eval("\x01") - 438);
         break;
      }
      if(eval("\x01") == 630)
      {
         set("\x01",eval("\x01") - 198);
         if(!_global.mx)
         {
            _global.mx = new Object();
         }
         §§pop();
         if(!_global.mx.transitions)
         {
            _global.mx.transitions = new Object();
         }
         §§pop();
         if(!_global.mx.transitions.Tween)
         {
            _loc2_ = mx.transitions.Tween = function(obj, prop, func, begin, finish, duration, useSeconds)
            {
               mx.transitions.OnEnterFrameBeacon.init();
               if(!arguments.length)
               {
                  return undefined;
               }
               this.obj = obj;
               this.prop = prop;
               this.begin = begin;
               this.position = begin;
               this.duration = duration;
               this.useSeconds = useSeconds;
               if(func)
               {
                  this.func = func;
               }
               this.finish = finish;
               this._listeners = [];
               this.addListener(this);
               this.start();
            }.prototype;
            _loc2_.__set__time = function(t)
            {
               this.prevTime = this._time;
               if(t > this.duration)
               {
                  if(this.looping)
                  {
                     this.rewind(t - this._duration);
                     this.update();
                     this.broadcastMessage("onMotionLooped",this);
                  }
                  else
                  {
                     if(this.useSeconds)
                     {
                        this._time = this._duration;
                        this.update();
                     }
                     this.stop();
                     this.broadcastMessage("onMotionFinished",this);
                  }
               }
               else if(t < 0)
               {
                  this.rewind();
                  this.update();
               }
               else
               {
                  this._time = t;
                  this.update();
               }
               return this.time;
            };
            _loc2_.__get__time = function()
            {
               return this._time;
            };
            _loc2_.__set__duration = function(d)
            {
               this._duration = !(d == null || d <= 0) ? d : _global.Infinity;
               return this.duration;
            };
            _loc2_.__get__duration = function()
            {
               return this._duration;
            };
            _loc2_.__set__FPS = function(fps)
            {
               var _loc2_ = this.isPlaying;
               this.stopEnterFrame();
               this._fps = fps;
               if(_loc2_)
               {
                  this.startEnterFrame();
               }
               return this.FPS;
            };
            _loc2_.__get__FPS = function()
            {
               return this._fps;
            };
            _loc2_.__set__position = function(p)
            {
               this.setPosition(p);
               return this.position;
            };
            _loc2_.setPosition = function(p)
            {
               this.prevPos = this._pos;
               this.obj[this.prop] = this._pos = p;
               this.broadcastMessage("onMotionChanged",this,this._pos);
               updateAfterEvent();
            };
            _loc2_.__get__position = function()
            {
               return this.getPosition();
            };
            _loc2_.getPosition = function(t)
            {
               if(t == undefined)
               {
                  t = this._time;
               }
               return this.func(t,this.begin,this.change,this._duration);
            };
            _loc2_.__set__finish = function(f)
            {
               this.change = f - this.begin;
               return this.finish;
            };
            _loc2_.__get__finish = function()
            {
               return this.begin + this.change;
            };
            _loc2_.continueTo = function(finish, duration)
            {
               this.begin = this.position;
               this.finish = finish;
               if(duration != undefined)
               {
                  this.duration = duration;
               }
               this.start();
            };
            _loc2_.yoyo = function()
            {
               this.continueTo(this.begin,this.time);
            };
            _loc2_.startEnterFrame = function()
            {
               if(this._fps == undefined)
               {
                  _global.MovieClip.addListener(this);
               }
               else
               {
                  this._intervalID = setInterval(this,"onEnterFrame",1000 / this._fps);
               }
               this.isPlaying = true;
            };
            _loc2_.stopEnterFrame = function()
            {
               if(this._fps == undefined)
               {
                  _global.MovieClip.removeListener(this);
               }
               else
               {
                  clearInterval(this._intervalID);
               }
               this.isPlaying = false;
            };
            _loc2_.start = function()
            {
               this.rewind();
               this.startEnterFrame();
               this.broadcastMessage("onMotionStarted",this);
            };
            _loc2_.stop = function()
            {
               this.stopEnterFrame();
               this.broadcastMessage("onMotionStopped",this);
            };
            _loc2_.resume = function()
            {
               this.fixTime();
               this.startEnterFrame();
               this.broadcastMessage("onMotionResumed",this);
            };
            _loc2_.rewind = function(t)
            {
               this._time = t != undefined ? t : 0;
               this.fixTime();
               this.update();
            };
            _loc2_.fforward = function()
            {
               this.time = this._duration;
               this.fixTime();
            };
            _loc2_.nextFrame = function()
            {
               if(this.useSeconds)
               {
                  this.time = (getTimer() - this._startTime) / 1000;
               }
               else
               {
                  this.time = this._time + 1;
               }
            };
            _loc2_.onEnterFrame = function()
            {
               this.nextFrame();
            };
            _loc2_.prevFrame = function()
            {
               if(!this.useSeconds)
               {
                  this.time = this._time - 1;
               }
            };
            _loc2_.toString = function()
            {
               return "[Tween]";
            };
            _loc2_.fixTime = function()
            {
               if(this.useSeconds)
               {
                  this._startTime = getTimer() - this._time * 1000;
               }
            };
            _loc2_.update = function()
            {
               this.position = this.getPosition(this._time);
            };
            mx.transitions.Tween = function(obj, prop, func, begin, finish, duration, useSeconds)
            {
               mx.transitions.OnEnterFrameBeacon.init();
               if(!arguments.length)
               {
                  return undefined;
               }
               this.obj = obj;
               this.prop = prop;
               this.begin = begin;
               this.position = begin;
               this.duration = duration;
               this.useSeconds = useSeconds;
               if(func)
               {
                  this.func = func;
               }
               this.finish = finish;
               this._listeners = [];
               this.addListener(this);
               this.start();
            }.__initBeacon = mx.transitions.OnEnterFrameBeacon.init();
            mx.transitions.Tween = function(obj, prop, func, begin, finish, duration, useSeconds)
            {
               mx.transitions.OnEnterFrameBeacon.init();
               if(!arguments.length)
               {
                  return undefined;
               }
               this.obj = obj;
               this.prop = prop;
               this.begin = begin;
               this.position = begin;
               this.duration = duration;
               this.useSeconds = useSeconds;
               if(func)
               {
                  this.func = func;
               }
               this.finish = finish;
               this._listeners = [];
               this.addListener(this);
               this.start();
            }.__initBroadcaster = mx.transitions.BroadcasterMX.initialize(mx.transitions.Tween.prototype,true);
            _loc2_.func = function(t, b, c, d)
            {
               return c * t / d + b;
            };
            §§push(_loc2_.addProperty("FPS",_loc2_.__get__FPS,_loc2_.__set__FPS));
            §§push(_loc2_.addProperty("duration",_loc2_.__get__duration,_loc2_.__set__duration));
            §§push(_loc2_.addProperty("finish",_loc2_.__get__finish,_loc2_.__set__finish));
            §§push(_loc2_.addProperty("position",_loc2_.__get__position,_loc2_.__set__position));
            §§push(_loc2_.addProperty("time",_loc2_.__get__time,_loc2_.__set__time));
            §§push(ASSetPropFlags(mx.transitions.Tween.prototype,null,1));
         }
         §§pop();
         break;
      }
      if(eval("\x01") == 985)
      {
         set("\x01",eval("\x01") - 923);
      }
      else if(eval("\x01") == 913)
      {
         set("\x01",eval("\x01") - 283);
      }
      else if(eval("\x01") == 53)
      {
         set("\x01",eval("\x01") + 140);
         §§push("\x0f");
      }
      else if(eval("\x01") == 522)
      {
         set("\x01",eval("\x01") + 391);
         if(§§pop())
         {
            set("\x01",eval("\x01") - 283);
         }
      }
      else
      {
         if(eval("\x01") != 924)
         {
            if(eval("\x01") == 432)
            {
               set("\x01",eval("\x01") - 432);
            }
            break;
         }
         set("\x01",eval("\x01") - 871);
         var §§pop() = §§pop();
      }
   }
}
