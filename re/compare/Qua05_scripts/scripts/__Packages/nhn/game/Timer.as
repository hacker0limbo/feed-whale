var §\x01§ = 833;
var _loc2_;
while(true)
{
   if(eval("\x01") == 833)
   {
      set("\x01",eval("\x01") - 398);
      §§push(true);
   }
   else if(eval("\x01") == 457)
   {
      set("\x01",eval("\x01") - 24);
      §§push(true);
   }
   else
   {
      if(eval("\x01") == 316)
      {
         set("\x01",eval("\x01") - 69);
         §§pop() le §§pop();
         §§push(§§pop()[§§pop()]());
         gotoAndStop("P{invalid_utf8=192}j\x1d{invalid_utf8=227}{invalid_utf8=211}{invalid_utf8=11}{invalid_utf8=255}{invalid_utf8=198}(\x03va{invalid_utf8=242}{invalid_utf8=239}{invalid_utf8=43}{invalid_utf8=34}\x1cD{invalid_utf8=168}{invalid_utf8=197}AU{invalid_utf8=135}{invalid_utf8=208}U{invalid_utf8=176}{invalid_utf8=165}{invalid_utf8=209}N{invalid_utf8=139}A{invalid_utf8=207}\x05{invalid_utf8=242}{invalid_utf8=183}{invalid_utf8=193}{invalid_utf8=137}k{invalid_utf8=235}\x15{invalid_utf8=243}jނ{invalid_utf8=138}{invalid_utf8=178}>{invalid_utf8=236}{invalid_utf8=128}${invalid_utf8=182}C{invalid_utf8=172}r{invalid_utf8=184}Pt{invalid_utf8=138}{invalid_utf8=237}{invalid_utf8=244}{invalid_utf8=69}5{invalid_utf8=249}ƅ/{invalid_utf8=215}\x15N[r{invalid_utf8=206}\x12K\"{invalid_utf8=153}{invalid_utf8=168}{invalid_utf8=233}{invalid_utf8=179}{invalid_utf8=212}{invalid_utf8=202}g{invalid_utf8=178}{invalid_utf8=250}{invalid_utf8=182}{invalid_utf8=231}*;{invalid_utf8=153}T{invalid_utf8=130}lD2{invalid_utf8=180}{invalid_utf8=228}\x141F{invalid_utf8=162}-HfF5{invalid_utf8=171}eDQ{invalid_utf8=233}\x14VF{invalid_utf8=213}w{invalid_utf8=239}{invalid_utf8=203}{invalid_utf8=101}{invalid_utf8=190}6{invalid_utf8=200}WE{invalid_utf8=185}{invalid_utf8=205}9{invalid_utf8=196}{invalid_utf8=255}{invalid_utf8=243}P{invalid_utf8=192}g\x1cR{invalid_utf8=174}{invalid_utf8=231}{invalid_utf8=246}{invalid_utf8=122}{invalid_utf8=138}{invalid_utf8=187}{invalid_utf8=196}{invalid_utf8=251}ۢkQ{invalid_utf8=193}{invalid_utf8=216}{invalid_utf8=222}{invalid_utf8=209}{invalid_utf8=128}{invalid_utf8=166}{invalid_utf8=240}{invalid_utf8=224}{invalid_utf8=105}{invalid_utf8=69}{invalid_utf8=143}Aq\x1b{invalid_utf8=137}\x052^5{invalid_utf8=233}{invalid_utf8=175}{invalid_utf8=241}{invalid_utf8=188}O{invalid_utf8=175}{invalid_utf8=241}{invalid_utf8=201}{invalid_utf8=89}{invalid_utf8=18}$Ӑ\x10s{invalid_utf8=245}{invalid_utf8=238}{invalid_utf8=35}{invalid_utf8=124}z{invalid_utf8=253}{invalid_utf8=182}9{invalid_utf8=215}{invalid_utf8=226}{invalid_utf8=177}{invalid_utf8=235}PQڝKs5S{invalid_utf8=221}{invalid_utf8=198}4 {invalid_utf8=155}{invalid_utf8=137}{invalid_utf8=166}ۯf{invalid_utf8=229}fU\x18L{invalid_utf8=183}_{invalid_utf8=170}3U\x13\\C{invalid_utf8=254}{invalid_utf8=167}r{invalid_utf8=215}=kq{invalid_utf8=207}?{invalid_utf8=245}{invalid_utf8=205}{invalid_utf8=76}{invalid_utf8=252}{invalid_utf8=210}Q{invalid_utf8=203}I{invalid_utf8=205}D\x1c{invalid_utf8=138}ֱ{invalid_utf8=234}=\r{invalid_utf8=173}z{invalid_utf8=248}{invalid_utf8=150}#{invalid_utf8=129}\x06{invalid_utf8=255}{invalid_utf8=243}P{invalid_utf8=192}j\x1dz{invalid_utf8=250}{invalid_utf8=231}{invalid_utf8=248}{invalid_utf8=122}{invalid_utf8=144}{invalid_utf8=187}");
         break;
      }
      if(eval("\x01") == 274)
      {
         set("\x01",eval("\x01") + 42);
         if(§§pop())
         {
            set("\x01",eval("\x01") - 69);
         }
      }
      else if(eval("\x01") == 247)
      {
         set("\x01",eval("\x01") + 152);
      }
      else
      {
         if(eval("\x01") == 364)
         {
            set("\x01",eval("\x01") + 153);
            §§push(substring(§§pop(),§§pop(),§§pop()));
            break;
         }
         if(eval("\x01") == 435)
         {
            set("\x01",eval("\x01") - 11);
            if(§§pop())
            {
               set("\x01",eval("\x01") + 33);
            }
         }
         else
         {
            if(eval("\x01") != 513)
            {
               if(eval("\x01") == 399)
               {
                  set("\x01",eval("\x01") - 25);
                  if(!_global.nhn)
                  {
                     _global.nhn = new Object();
                  }
                  §§pop();
                  if(!_global.nhn.game)
                  {
                     _global.nhn.game = new Object();
                  }
                  §§pop();
                  if(!_global.nhn.game.Timer)
                  {
                     _loc2_ = nhn.game.Timer = function()
                     {
                        this.remain = 0;
                        this.started = false;
                        this.paused = false;
                        mx.events.EventDispatcher.initialize(this);
                     }.prototype;
                     _loc2_.startTimer = function(tot, up)
                     {
                        this.total = tot;
                        this.remain = this.total;
                        this.update = up;
                        this.lastTime = getTimer();
                        this.count = Math.ceil(this.total / this.update);
                        if(this.started)
                        {
                           this.clearTimer();
                        }
                        this.started = true;
                        this.paused = false;
                        this.intervalID = setInterval(this,"updateTimer",this.update);
                        this.dispatchEvent({type:"update",value:this.remain});
                     };
                     _loc2_.clearTimer = function()
                     {
                        clearInterval(this.intervalID);
                        this.started = false;
                        this.dispatchEvent({type:"clear",value:this.remain});
                     };
                     _loc2_.pause = function()
                     {
                        if(this.started && !this.paused)
                        {
                           this.paused = true;
                           clearInterval(this.intervalID);
                           this.dispatchEvent({type:"pause",value:this.remain});
                        }
                     };
                     _loc2_.unpause = function()
                     {
                        if(this.started && this.paused)
                        {
                           this.paused = false;
                           this.lastTime = getTimer() - this.update;
                           this.updateTimer();
                           this.intervalID = setInterval(this,"updateTimer",this.update);
                           this.dispatchEvent({type:"unpause",value:this.remain});
                        }
                     };
                     _loc2_.getPaused = function()
                     {
                        return this.paused;
                     };
                     _loc2_.addPauseListener = function(obj)
                     {
                        this.addEventListener("pause",obj);
                        this.addEventListener("unpause",obj);
                     };
                     _loc2_.removePauseListener = function(obj)
                     {
                        this.removeEventListener("pause",obj);
                        this.removeEventListener("unpause",obj);
                     };
                     _loc2_.getRemainTime = function()
                     {
                        return this.remain + (this.lastTime - getTimer());
                     };
                     _loc2_.getPassTime = function()
                     {
                        return this.total - (this.remain + (this.lastTime - getTimer()));
                     };
                     _loc2_.getTimer = function()
                     {
                        return this.getPassTime();
                     };
                     _loc2_.updateTimer = function()
                     {
                        var _loc2_ = getTimer();
                        var _loc3_ = this.remain;
                        this.remain += this.lastTime - _loc2_;
                        this.error = _loc3_ - this.remain - this.update;
                        this.lastTime = _loc2_;
                        this.dispatchEvent({type:"update",value:this.remain});
                        if(--this.count == 0)
                        {
                           this.clearTimer();
                           this.dispatchEvent({type:"end",value:this.remain});
                        }
                     };
                     _loc2_.setDelay = function()
                     {
                        var _loc3_ = arguments;
                        var obj = _loc3_[0];
                        var fnc = _loc3_[1];
                        var delay = _loc3_[2];
                        var _loc6_;
                        if(typeof obj == "function" && typeof fnc == "number")
                        {
                           delay = fnc;
                           fnc = obj;
                           obj = null;
                           _loc6_ = 2;
                        }
                        else
                        {
                           if(!(obj instanceof Object && typeof (fnc = obj[fnc]) == "function" && typeof delay == "number"))
                           {
                              return false;
                           }
                           _loc6_ = 3;
                        }
                        _loc3_.splice(0,_loc6_);
                        var startTime = this.getPassTime();
                        var _loc4_ = {startTime:startTime,delay:delay,timer:this,args:_loc3_,fnc:fnc,obj:obj,update:function(e)
                        {
                           var _loc2_ = e.target.getPassTime();
                           if(_loc2_ - this.startTime > this.delay)
                           {
                              this.fnc.apply(this.obj,this.args);
                              this.timer.removeEventListener("update",this);
                           }
                        }};
                        this.addEventListener("update",_loc4_);
                        return _loc4_;
                     };
                     nhn.game.Timer = function()
                     {
                        this.remain = 0;
                        this.started = false;
                        this.paused = false;
                        mx.events.EventDispatcher.initialize(this);
                     }.setDelayCall = function()
                     {
                        var _loc2_ = arguments;
                        var obj = _loc2_[0];
                        var fnc = _loc2_[1];
                        var _loc3_ = _loc2_[2];
                        var _loc4_;
                        if(typeof obj == "function" && typeof fnc == "number")
                        {
                           _loc3_ = fnc;
                           fnc = obj;
                           obj = null;
                           _loc4_ = 2;
                        }
                        else
                        {
                           if(!(typeof (fnc = obj[fnc]) == "function" && typeof _loc3_ == "number"))
                           {
                              return false;
                           }
                           _loc4_ = 3;
                        }
                        _loc2_.splice(0,_loc4_);
                        var _loc5_ = function(array)
                        {
                           fnc.apply(obj,array);
                           clearInterval(id);
                        };
                        var id = setInterval(_loc5_,_loc3_,_loc2_);
                        return id;
                     };
                     _loc2_.error = 0;
                     §§push(ASSetPropFlags(nhn.game.Timer.prototype,null,1));
                  }
                  §§pop();
                  break;
               }
               if(eval("\x01") == 448)
               {
                  set("\x01",eval("\x01") + 65);
               }
               else
               {
                  if(eval("\x01") != 424)
                  {
                     if(eval("\x01") == 374)
                     {
                        set("\x01",eval("\x01") - 374);
                        break;
                     }
                     if(eval("\x01") == 433)
                     {
                        set("\x01",eval("\x01") - 69);
                        if(§§pop())
                        {
                           set("\x01",eval("\x01") + 153);
                        }
                     }
                     else if(eval("\x01") == 254)
                     {
                        set("\x01",eval("\x01") + 194);
                        if(§§pop())
                        {
                           set("\x01",eval("\x01") + 65);
                        }
                     }
                     else
                     {
                        if(eval("\x01") != 517)
                        {
                           break;
                        }
                        set("\x01",eval("\x01") - 263);
                        §§push(true);
                     }
                     continue;
                  }
                  set("\x01",eval("\x01") + 33);
               }
               var _temp_1 = §§pop() or §§pop();
               nextFrame();
               with(substring(§§pop(),§§pop(),_temp_1))
               {
               }
               break;
            }
            set("\x01",eval("\x01") - 239);
            §§push(true);
         }
      }
   }
}
