function §\x04\x05§()
{
   set("\x03",78 % 511 * 5);
   return eval("\x03");
}
var §\x01§ = 2 + "\x04\x05"();
var _loc2_;
while(true)

/* =============== de-flattened blocks =============== */

/* ----- state 20 ----- */
   set("\x01",eval("\x01") + 293);
   if(§§pop())
   set("\x01",eval("\x01") + 317);

/* ----- state 82 ----- */
   set("\x01",eval("\x01") + 40);

/* ----- state 94 ----- */
   set("\x01",eval("\x01") + 199);

/* ----- state 122 ----- */
   set("\x01",eval("\x01") + 111);
   §§push("\x0f");
   §§push(1);

/* ----- state 222 ----- */
   set("\x01",eval("\x01") + 300);
   if(§§pop())
   set("\x01",eval("\x01") - 89);

/* ----- state 233 ----- */
   set("\x01",eval("\x01") + 107);
   var §§pop() = §§pop();

/* ----- state 234 ----- */
   set("\x01",eval("\x01") + 248);
   §§push(!§§pop());

/* ----- state 293 ----- */
   set("\x01",eval("\x01") - 71);
   §§push(true);

/* ----- state 313 ----- */
   set("\x01",eval("\x01") + 317);

/* ----- state 340 ----- */
   set("\x01",eval("\x01") + 419);
   §§push("\x0f");

/* ----- state 392 ----- */
   set("\x01",eval("\x01") - 372);
   §§push(true);

/* ----- state 433 ----- */
   set("\x01",eval("\x01") - 311);

/* ----- state 482 ----- */
   set("\x01",eval("\x01") - 286);
   if(§§pop())
   set("\x01",eval("\x01") + 769);

/* ----- state 522 ----- */
   set("\x01",eval("\x01") - 89);
   gotoAndStop(57765);
   §§push(§§pop() ^ length(§§pop() == §§pop()));

/* ----- state 630 ----- */
   set("\x01",eval("\x01") - 337);

/* ----- state 759 ----- */
   set("\x01",eval("\x01") - 525);
   §§push(eval(§§pop()));

/* ----- unconditional / else ----- */
   if(eval("\x01") == 965)
   set("\x01",eval("\x01") - 797);
   if(!_global.nhn)
   _global.nhn = new Object();
   §§pop();
   if(!_global.nhn.game)
   _global.nhn.game = new Object();
   §§pop();
   if(!_global.nhn.game.DigitSet)
   _loc2_ = nhn.game.DigitSet = function(mc)
   this.base_mc = mc;
   this.arranged = false;
   this.figure = "0";
   this.digits_array = new Array();
   }.prototype;
   _loc2_.__set__number = function(v)
   if(!this.arranged)
   this.arrange();
   this.figure = String(v);
   var _loc3_ = this.digits_array.length;
   var _loc2_ = 0;
   while(_loc2_ < _loc3_)
   if(_loc2_ < this.figure.length)
   this.digits_array[_loc2_].number = this.numberAt(_loc2_);
   this.digits_array[_loc2_].visible = true;
   else
   this.digits_array[_loc2_].number = 0;
   this.digits_array[_loc2_].visible = false;
   _loc2_ = _loc2_ + 1;
   this.applyAlign(this.figure.length);
   return this.number;
   };
   _loc2_.applyAlign = function(length)
   var _loc3_;
   var _loc4_;
   var _loc2_;
   if(this.align == "center")
   _loc3_ = this.width / (this.digits_array.length - 1);
   _loc4_ = (this.left + this.right) / 2 - (length - 1) * _loc3_ / 2;
   _loc2_ = 0;
   while(_loc2_ < length)
   this.digits_array[_loc2_]._x = _loc4_ + _loc2_ * _loc3_;
   _loc2_ = _loc2_ + 1;
   };
   _loc2_.__get__number = function()
   return Number(this.figure);
   };
   _loc2_.registerDigit = function(dg)
   this.digits_array.push(dg);
   this.arranged = false;
   };
   _loc2_.numberAt = function(i)
   return Number(this.figure.charAt(this.figure.length - i - 1));
   };
   _loc2_.arrange = function()
   var _loc4_ = this.digits_array;
   var _loc7_ = _loc4_.length;
   var _loc5_;
   var _loc6_;
   var _loc8_;
   var _loc3_ = 0;
   var _loc2_;
   while(_loc3_ < _loc7_)
   _loc2_ = _loc3_;
   while(_loc2_ < _loc7_)
   _loc5_ = _loc4_[_loc3_];
   _loc6_ = _loc4_[_loc2_];
   if(_loc5_.before(_loc6_))
   _loc8_ = _loc5_;
   _loc4_[_loc3_] = _loc6_;
   _loc4_[_loc2_] = _loc5_;
   _loc2_ = _loc2_ + 1;
   _loc3_ = _loc3_ + 1;
   this.right = _loc4_[_loc4_.length - 1]._x;
   this.left = _loc4_[0]._x;
   this.width = this.right - this.left;
   this.arranged = true;
   };
   nhn.game.DigitSet = function(mc)
   this.base_mc = mc;
   this.arranged = false;
   this.figure = "0";
   this.digits_array = new Array();
   }.digitsets = new Object();
   §§push(_loc2_.addProperty("number",_loc2_.__get__number,_loc2_.__set__number));
   §§push(ASSetPropFlags(nhn.game.DigitSet.prototype,null,1));
   §§pop();
   if(eval("\x01") == 168)
   set("\x01",eval("\x01") - 168);

/* ============= end de-flattened blocks ============= */
