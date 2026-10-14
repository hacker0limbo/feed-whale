function §\x04\x05§()
{
   set("\x03",564 % 511 * 5);
   return eval("\x03");
}
var §\x01§ = 333 + "\x04\x05"();
var _loc2_;
while(true)
{
   if(eval("\x01") == 598)
   {
      set("\x01",eval("\x01") - 201);
      §§push(true);
   }
   else
   {
      if(eval("\x01") == 28)
      {
         set("\x01",eval("\x01") + 259);
         §§push(new §\§\§pop()§());
         break;
      }
      if(eval("\x01") == 397)
      {
         set("\x01",eval("\x01") - 369);
         if(§§pop())
         {
            set("\x01",eval("\x01") + 259);
         }
      }
      else
      {
         if(eval("\x01") == 777)
         {
            set("\x01",eval("\x01") - 728);
            if(!eval("q\x1c{invalid_utf8=174}{invalid_utf8=233}")["{invalid_utf8=170}{invalid_utf8=252}"])
            {
               eval("q\x1c{invalid_utf8=174}{invalid_utf8=233}")["{invalid_utf8=170}{invalid_utf8=252}"] = new §&{invalid_utf8=232}{invalid_utf8=230}§();
            }
            §§pop();
            if(!eval("q\x1c{invalid_utf8=174}{invalid_utf8=233}")["{invalid_utf8=170}{invalid_utf8=252}"]["{invalid_utf8=242}{invalid_utf8=218}"])
            {
               eval("q\x1c{invalid_utf8=174}{invalid_utf8=233}")["{invalid_utf8=170}{invalid_utf8=252}"]["{invalid_utf8=242}{invalid_utf8=218}"] = new §&{invalid_utf8=232}{invalid_utf8=230}§();
            }
            §§pop();
            if(!eval("q\x1c{invalid_utf8=174}{invalid_utf8=233}")["{invalid_utf8=170}{invalid_utf8=252}"]["{invalid_utf8=242}{invalid_utf8=218}"][§§constant(4)])
            {
               _loc2_ = eval("{invalid_utf8=170}{invalid_utf8=252}")["{invalid_utf8=242}{invalid_utf8=218}"][§§constant(4)] = function()
               {
                  this[§§constant(5)] = 0;
                  this[§§constant(6)] = false;
                  this[§§constant(7)] = false;
                  eval(§§constant(8))[§§constant(9)][§§constant(10)][§§constant(11)](this);
               }[§§constant(12)];
               _loc2_[§§constant(13)] = function(tot, up)
               {
                  this[§§constant(14)] = tot;
                  this[§§constant(5)] = this[§§constant(14)];
                  this[§§constant(15)] = up;
                  this[§§constant(16)] = getTimer();
                  this[§§constant(17)] = eval(§§constant(18))[§§constant(19)](this[§§constant(14)] / this[§§constant(15)]);
                  if(this[§§constant(6)])
                  {
                     this[§§constant(20)]();
                  }
                  this[§§constant(6)] = true;
                  this[§§constant(7)] = false;
                  this[§§constant(21)] = §§constant(23)(this,§§constant(22),this[§§constant(15)]);
                  this[§§constant(26)]({(§§constant(24)):§§constant(15),(§§constant(25)):this[§§constant(5)]});
               };
               _loc2_[§§constant(20)] = function()
               {
                  §§constant(27)(this[§§constant(21)]);
                  this[§§constant(6)] = false;
                  this[§§constant(26)]({(§§constant(24)):§§constant(28),(§§constant(25)):this[§§constant(5)]});
               };
               _loc2_[§§constant(29)] = function()
               {
                  if(this[§§constant(6)] && !this[§§constant(7)])
                  {
                     this[§§constant(7)] = true;
                     §§constant(27)(this[§§constant(21)]);
                     this[§§constant(26)]({(§§constant(24)):§§constant(29),(§§constant(25)):this[§§constant(5)]});
                  }
               };
               _loc2_[§§constant(30)] = function()
               {
                  if(this[§§constant(6)] && this[§§constant(7)])
                  {
                     this[§§constant(7)] = false;
                     this[§§constant(16)] = getTimer() - this[§§constant(15)];
                     this[§§constant(22)]();
                     this[§§constant(21)] = §§constant(23)(this,§§constant(22),this[§§constant(15)]);
                     this[§§constant(26)]({(§§constant(24)):§§constant(30),(§§constant(25)):this[§§constant(5)]});
                  }
               };
               _loc2_[§§constant(31)] = function()
               {
                  return this[§§constant(7)];
               };
               _loc2_[§§constant(32)] = function(obj)
               {
                  this[§§constant(33)](§§constant(29),obj);
                  this[§§constant(33)](§§constant(30),obj);
               };
               _loc2_[§§constant(34)] = function(obj)
               {
                  this[§§constant(35)](§§constant(29),obj);
                  this[§§constant(35)](§§constant(30),obj);
               };
               _loc2_[§§constant(36)] = function()
               {
                  return this[§§constant(5)] + (this[§§constant(16)] - getTimer());
               };
               _loc2_[§§constant(37)] = function()
               {
                  return this[§§constant(14)] - (this[§§constant(5)] + (this[§§constant(16)] - getTimer()));
               };
               _loc2_[§§constant(38)] = function()
               {
                  return this[§§constant(37)]();
               };
               _loc2_[§§constant(22)] = function()
               {
                  var _loc2_ = getTimer();
                  var _loc3_ = this[§§constant(5)];
                  this[§§constant(5)] += this[§§constant(16)] - _loc2_;
                  this[§§constant(39)] = _loc3_ - this[§§constant(5)] - this[§§constant(15)];
                  this[§§constant(16)] = _loc2_;
                  this[§§constant(26)]({(§§constant(24)):§§constant(15),(§§constant(25)):this[§§constant(5)]});
                  if(--this[§§constant(17)] == 0)
                  {
                     this[§§constant(20)]();
                     this[§§constant(26)]({(§§constant(24)):§§constant(40),(§§constant(25)):this[§§constant(5)]});
                  }
               };
               _loc2_[§§constant(41)] = function()
               {
                  var _loc3_ = arguments;
                  var _loc7_ = _loc3_[0];
                  var _loc10_ = _loc3_[1];
                  var _loc11_ = _loc3_[2];
                  var _loc6_;
                  if(typeof _loc7_ == §§constant(42) && typeof _loc10_ == §§constant(43))
                  {
                     _loc11_ = _loc10_;
                     _loc10_ = _loc7_;
                     _loc7_ = null;
                     _loc6_ = 2;
                  }
                  else
                  {
                     if(!(_loc7_ instanceof eval("&{invalid_utf8=232}{invalid_utf8=230}") && typeof (_loc10_ = _loc7_[_loc10_]) == §§constant(42) && typeof _loc11_ == §§constant(43)))
                     {
                        trace(§§constant(44));
                        return false;
                     }
                     _loc6_ = 3;
                  }
                  _loc3_[§§constant(45)](0,_loc6_);
                  var _loc12_ = this[§§constant(37)]();
                  var _loc4_ = {(§§constant(46)):_loc12_,(§§constant(47)):_loc11_,(§§constant(48)):this,(§§constant(49)):_loc3_,(§§constant(50)):_loc10_,(§§constant(51)):_loc7_,(§§constant(15)):function(e)
                  {
                     var _loc2_ = e[§§constant(52)][§§constant(37)]();
                     if(_loc2_ - this[§§constant(46)] > this[§§constant(47)])
                     {
                        this[§§constant(50)][§§constant(53)](this[§§constant(51)],this[§§constant(49)]);
                        this[§§constant(48)][§§constant(35)](§§constant(15),this);
                     }
                  }};
                  this[§§constant(33)](§§constant(15),_loc4_);
                  return _loc4_;
               };
               eval("{invalid_utf8=170}{invalid_utf8=252}")["{invalid_utf8=242}{invalid_utf8=218}"][§§constant(4)] = function()
               {
                  this[§§constant(5)] = 0;
                  this[§§constant(6)] = false;
                  this[§§constant(7)] = false;
                  eval(§§constant(8))[§§constant(9)][§§constant(10)][§§constant(11)](this);
               }[§§constant(54)] = function()
               {
                  var _loc2_ = arguments;
                  var §§constant(51) = _loc2_[0];
                  var §§constant(50) = _loc2_[1];
                  var _loc3_ = _loc2_[2];
                  var _loc4_;
                  if(typeof eval(§§constant(51)) == §§constant(42) && typeof eval(§§constant(50)) == §§constant(43))
                  {
                     _loc3_ = eval(§§constant(50));
                     set(§§constant(50),eval(§§constant(51)));
                     set(§§constant(51),null);
                     _loc4_ = 2;
                  }
                  else
                  {
                     if(!(typeof (§\§\§constant(50)§ = eval(§§constant(51))[eval(§§constant(50))]) == §§constant(42) && typeof _loc3_ == §§constant(43)))
                     {
                        trace(§§constant(44));
                        return false;
                     }
                     _loc4_ = 3;
                  }
                  _loc2_[§§constant(45)](0,_loc4_);
                  var _loc5_ = function(array)
                  {
                     eval(§§constant(50))[§§constant(53)](eval(§§constant(51)),array);
                     §§constant(27)(eval(§§constant(55)));
                  };
                  var §§constant(55) = §§constant(23)(_loc5_,_loc3_,_loc2_);
                  return eval(§§constant(55));
               };
               _loc2_[§§constant(39)] = 0;
               §§push(§§constant(56)(eval("{invalid_utf8=170}{invalid_utf8=252}")["{invalid_utf8=242}{invalid_utf8=218}"][§§constant(4)][§§constant(12)],null,1));
            }
            §§pop();
            break;
         }
         if(eval("\x01") == 641)
         {
            set("\x01",eval("\x01") + 232);
            §§push(eval(§§pop()));
         }
         else if(eval("\x01") == 39)
         {
            set("\x01",eval("\x01") + 931);
         }
         else if(eval("\x01") == 189)
         {
            set("\x01",eval("\x01") + 452);
            §§push("\x0f");
         }
         else if(eval("\x01") == 873)
         {
            set("\x01",eval("\x01") - 551);
            §§push(!§§pop());
         }
         else if(eval("\x01") == 287)
         {
            set("\x01",eval("\x01") + 683);
         }
         else if(eval("\x01") == 322)
         {
            set("\x01",eval("\x01") + 55);
            if(§§pop())
            {
               set("\x01",eval("\x01") + 400);
            }
         }
         else if(eval("\x01") == 208)
         {
            set("\x01",eval("\x01") - 19);
            var §§pop() = §§pop();
         }
         else if(eval("\x01") == 377)
         {
            set("\x01",eval("\x01") + 400);
         }
         else
         {
            if(eval("\x01") != 970)
            {
               if(eval("\x01") == 49)
               {
                  set("\x01",eval("\x01") - 49);
               }
               break;
            }
            set("\x01",eval("\x01") - 762);
            §§push("\x0f");
            §§push(1);
         }
      }
   }
}
