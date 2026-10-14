function §\x04\x05§()
{
   set("\x03",584 % 511 * 5);
   return eval("\x03");
}
var §\x01§ = 474 + "\x04\x05"();
while(true)

/* =============== de-flattened blocks =============== */

/* ----- state 21 ----- */
   set("\x01",eval("\x01") - 21);

/* ----- state 43 ----- */
   set("\x01",eval("\x01") + 838);

/* ----- state 75 ----- */
   set("\x01",eval("\x01") + 492);

/* ----- state 91 ----- */
   set("\x01",eval("\x01") + 159);
   §§push("\x0f");

/* ----- state 136 ----- */
   set("\x01",eval("\x01") - 61);
   if(§§pop())
   set("\x01",eval("\x01") + 492);

/* ----- state 140 ----- */
   set("\x01",eval("\x01") + 209);
   §§push(!§§pop());

/* ----- state 250 ----- */
   set("\x01",eval("\x01") - 110);
   §§push(eval(§§pop()));

/* ----- state 349 ----- */
   set("\x01",eval("\x01") + 620);
   if(§§pop())
   set("\x01",eval("\x01") + 3);

/* ----- state 382 ----- */
   set("\x01",eval("\x01") - 246);
   §§push(true);

/* ----- state 526 ----- */
   set("\x01",eval("\x01") - 435);
   var §§pop() = §§pop();

/* ----- state 567 ----- */
   set("\x01",eval("\x01") + 314);

/* ----- state 622 ----- */
   set("\x01",eval("\x01") - 240);

/* ----- state 670 ----- */
   set("\x01",eval("\x01") + 80);
   if(§§pop())
   set("\x01",eval("\x01") - 128);

/* ----- state 750 ----- */
   set("\x01",eval("\x01") - 128);

/* ----- state 839 ----- */
   set("\x01",eval("\x01") - 169);
   §§push(true);

/* ----- state 881 ----- */
   set("\x01",eval("\x01") - 355);
   §§push("\x0f");
   §§push(1);

/* ----- state 969 ----- */
   set("\x01",eval("\x01") + 3);

/* ----- state 972 ----- */
   set("\x01",eval("\x01") - 951);
   function hungryBar()
   if(hungry > 100)
   hungry = 100;
   hungry_bar.gotoAndStop(hungry_bar._totalframes + 1 - Math.round(hungry * hungry_bar._totalframes / 100));
   function makeItem(itype)
   item_listener.isShow = true;
   var _loc3_ = fish_area.getNextHighestDepth();
   var _loc2_ = fish_area.attachMovie("item","e" + _loc3_,_loc3_);
   _loc2_.item = itype;
   _loc2_._x = IV.RIGHT;
   _loc2_._y = (IV.TOP + IV.BOTTOM) / 2;
   _loc2_.onEnterFrame = function()
   this._x -= 3;
   if(this._x > IV.RIGHT)
   this.removeMovieClip();
   };
   eList.push(_loc2_);
   function removeItem()
   player_mc._alpha = 100;
   delete player_mc.item;
   function useItem(itype)
   sm.start(IV.SOUND_ITEM,0,1);
   player_mc.item = itype;
   if(itype == IV.ITEM_TRANS)
   player_mc._alpha = 40;
   nhn.game.Timer.setDelayCall(removeItem,5000);
   function grow(el)
   var _loc4_;
   if(random(5) != 0)
   _loc4_ = random(2) + 1;
   sm.start(IV["SOUND_EAT" + _loc4_],0,1);
   else
   sm.start(IV.SOUND_EAT3,0,1);
   playerAni("eat");
   var _loc5_ = getLevel();
   eatcount[el - 1]--;
   if(eatcount[el - 1] < 0)
   eatcount[el - 1] = 0;
   var _loc2_ = true;
   var _loc1_ = 0;
   while(_loc1_ < fishesTotal)
   if(eatcount[_loc1_] > 0)
   _loc2_ = false;
   _loc1_ = _loc1_ + 1;
   if(_loc2_)
   nextLevel();
   updateEatCount();
   hungry += HUNGRY_UP[el - 1];
   hungryBar();
   function addScore(s)
   score += s;
   score_mc.digitset.number = score;
   function getLevel()
   return player_mc._currentframe;
   function getEatLevel()
   return EAT_LEVEL[getLevel() - 1];
   function setEatCount()
   eatcount = [0,0,0,0];
   var _loc1_ = getEatLevel();
   var _loc2_ = _loc1_ - 1;
   eatcount[_loc1_ - 1] = NEXT_LEVEL[1][getLevel() - 1];
   if(_loc2_ > 0)
   eatcount[_loc2_ - 1] = NEXT_LEVEL[0][getLevel() - 1];
   updateEatCount();
   function updateEatCount()
   var _loc3_;
   var _loc2_ = 1;
   while(_loc2_ <= fishesTotal)
   _loc3_ = this["mission" + _loc2_];
   _loc3_.digitset.number = eatcount[_loc2_ - 1];
   if(eatcount[_loc2_ - 1] == 0)
   _loc3_._visible = false;
   else
   _loc3_._visible = true;
   _loc2_ = _loc2_ + 1;
   eatable_mc.gotoAndStop(getEatLevel());
   function nextLevel()
   sm.start(IV.SOUND_LEVEL,0,1);
   var _loc1_ = Math.round(hungry) * SCORE_LEVEL;
   addScore(_loc1_);
   if(getLevel() < LAST_LEVEL)
   level_mc.digitset.number += 1;
   player_mc.nextFrame();
   player_mc.light.gotoAndPlay(1);
   levelup_mc.play();
   setEatCount();
   hungry += 20;
   hungryBar();
   playerAni("normal");
   if(getLevel() > 4)
   makeItem(IV.ITEM_TRANS);
   if(getLevel() == SHARK_STAGE)
   sm.start(IV.SOUND_SHARKSTAGE,0,1);
   else
   onGameClear();
   function makeEnemy()
   var _loc4_ = getEatLevel();
   var _loc1_ = _loc4_ + random(3) - 1;
   if(ctenemy)
   _loc1_ = random(fishesTotal + 1) + 1;
   var _loc3_ = fish_area.getNextHighestDepth();
   var _loc2_;
   if(_loc1_ < 1)
   _loc1_ = 1;
   if(sharksTotal() >= 3 && _loc1_ > fishesTotal)
   _loc1_ = fishesTotal;
   if(_loc1_ <= fishesTotal)
   _loc2_ = fish_area.attachMovie("enemy","e" + _loc3_,_loc3_);
   else
   _loc2_ = fish_area.attachMovie("shark","e" + _loc3_,_loc3_);
   eList.push(_loc2_);
   _loc2_.setType(_loc1_);
   _loc2_.setStartPosition(random(2) * 2 - 1);
   function sharksTotal()
   var _loc2_ = 0;
   var _loc1_ = 0;
   while(_loc1_ < eList.length)
   if(eList[_loc1_].shark)
   _loc2_ = _loc2_ + 1;
   _loc1_ = _loc1_ + 1;
   return _loc2_;
   function removeEnemy(e)
   var _loc1_ = 0;
   while(_loc1_ < eList.length)
   if(eList[_loc1_] == e)
   eList.splice(_loc1_,1);
   e.removeMovieClip();
   return true;
   _loc1_ = _loc1_ + 1;
   function backBoggle(x, y, size)
   var _loc3_ = boggle_mc.getNextHighestDepth();
   var _loc2_ = boggle_mc.attachMovie("boggle","b" + _loc3_,_loc3_);
   _loc2_._x = x;
   _loc2_._y = y;
   var _loc4_ = random(70) + 25 * size;
   _loc2_.xspeed = (random(2) - 0.5) * 10;
   _loc2_._xscale = _loc4_;
   _loc2_._yscale = _loc4_;
   _loc2_._rotation = random(180);
   _loc2_.tw = new mx.transitions.Tween(_loc2_,"_y",mx.transitions.easing.Regular.easeIn,_loc2_._y,50 + random(50),Math.abs(_loc2_._y / 5) + 3);
   _loc2_.tw.onMotionChanged = function()
   this.obj._alpha -= 1;
   this.obj.xspeed *= 0.85;
   if(this.obj.xspeed < 1)
   this.obj.xspeed = Math.random() * 2 - 1;
   if(this.time > 1)
   this.obj._x += Math.round(this.obj.xspeed);
   };
   _loc2_.tw.onMotionFinished = function()
   this.obj.removeMovieClip();
   };
   function newBoggle()
   var _loc3_ = boggle_mc.getNextHighestDepth();
   var _loc2_ = boggle_mc.attachMovie("boggle","b" + _loc3_,_loc3_);
   _loc2_._x = player_mc._x + player_mc._xscale / 100 * player_mc.boggle._x;
   _loc2_._y = player_mc._y + player_mc.boggle._y - 10;
   var _loc4_ = random(70) + 25 * getLevel();
   _loc2_._xscale = _loc4_;
   _loc2_._yscale = _loc4_;
   _loc2_._rotation = random(180);
   _loc2_.xspeed = player_mc.xspeed;
   _loc2_.tw = new mx.transitions.Tween(_loc2_,"_y",mx.transitions.easing.Regular.easeIn,_loc2_._y,0,Math.abs(_loc2_._y / 5) + 1);
   _loc2_.tw.onMotionChanged = function()
   this.obj.xspeed *= 0.85;
   if(this.obj.xspeed < 1)
   this.obj.xspeed = Math.random() * 2 - 1;
   if(this.time > 1)
   this.obj._x += Math.round(this.obj.xspeed);
   };
   _loc2_.tw.onMotionFinished = function()
   this.obj.removeMovieClip();
   };
   function startGame()
   ServerConnection.onGameStart();
   sm.stop(IV.SOUND_OVER);
   sm.start(IV.SOUND_BG,0,10000);
   level_mc.digitset.align = "center";
   gameover_mc._visible = false;
   gameover_mc.gotoAndStop(1);
   gameclear_mc._visible = false;
   gameclear_mc.stop();
   for(var _loc1_ in fish_area)
   delete fish_area[_loc1_].onEnterFrame;
   fish_area[_loc1_].removeMovieClip();
   GAME.score = 0;
   score = 0;
   score_mc.digitset.number = 0;
   eList = [];
   eList.count = 0;
   hungry = 100;
   hungryBar();
   player_mc.onEnterFrame = pmc_onEnterFrame;
   player_mc.gotoAndStop(1);
   player_mc._yscale = 100;
   player_mc.die = false;
   playerAni("normal");
   makeEnemy();
   setEatCount();
   level_mc.digitset.number = getLevel();
   function onGameOver()
   sm.stop(IV.SOUND_BG);
   sm.start(IV.SOUND_OVER,0,1);
   player_mc.onEnterFrame = function()
   if(random(15) == 0)
   newBoggle();
   this._y += 2;
   if(this._y > IV.BOTTOM)
   this._y = IV.BOTTOM;
   };
   player_mc.die = true;
   playerAni("die");
   gameover_mc._visible = true;
   gameover_mc.play();
   GAME.score = score;
   ServerConnection.onGameOver();
   function onGameClear()
   sm.stop(IV.SOUND_BG);
   sm.start(IV.SOUND_ENDING,0,1000);
   delete player_mc.onEnterFrame;
   var _loc1_ = 0;
   while(_loc1_ < eList.length)
   eList[_loc1_].ani.gotoAndStop(1);
   delete eList[_loc1_].onEnterFrame;
   _loc1_ = _loc1_ + 1;
   gameclear_mc._visible = true;
   gameclear_mc.play();
   GAME.score = score;
   ServerConnection.onGameOver();
   function playerAni(m, d)
   var duration = 0;
   var count = 0;
   switch(m)
   case "normal":
   player_mc.ani.gotoAndStop(1);
   case "move":
   if(player_mc.ani._currentframe == 1)
   player_mc.ani.gotoAndStop(2);
   duration = d;
   case "eat":
   player_mc.ani.gotoAndStop(3);
   duration = 5;
   case "damage":
   player_mc.ani.gotoAndStop(4);
   duration = 1;
   case "die":
   player_mc.ani.gotoAndStop(5);
   duration = 50000;
   if(duration > 0)
   player_mc.ani.onEnterFrame = function()
   if(++count >= duration)
   this.gotoAndStop(1);
   count = 0;
   delete this.onEnterFrame;
   };
   _global.IV = {};
   IV.TOP = aqua_mc._y;
   IV.BOTTOM = aqua_mc._y + aqua_mc._height;
   IV.LEFT = aqua_mc._x;
   IV.RIGHT = aqua_mc._x + aqua_mc._width;
   IV.ITEM_TRANS = 1;
   IV.SOUND_BG = 0;
   IV.SOUND_OVER = 1;
   IV.SOUND_ENDING = 2;
   IV.SOUND_LEVEL = 3;
   IV.SOUND_ITEM = 4;
   IV.SOUND_EAT1 = 5;
   IV.SOUND_EAT2 = 6;
   IV.SOUND_EAT3 = 11;
   IV.SOUND_HIT = 8;
   IV.SOUND_SHARKSTAGE = 9;
   IV.SOUND_SHARK = 10;
   _global.GAME = {};
   sm = new nhn.game.SoundMaster(this,9999);
   sm.attachAllSound("s_bg","s_over2","s_ending","s_level","s_item","s_eat1","s_eat2","s_bomb1","s_bomb2","s_sharkstage1","s_shark1","s_eat3");
   sm.setVolume(IV.SOUND_BG,32);
   sm.setVolume(IV.SOUND_SHARK,64);
   fishesTotal = 4;
   SPEED_LEVEL = [0.9,0.9,0.88,0.86,0.85,0.85,0.85,0.84,0.83,0.82];
   EAT_LEVEL = [1,1,2,2,3,3,3,4,4,4];
   SHARK_STAGE = 8;
   NEXT_LEVEL = [];
   NEXT_LEVEL[0] = [0,0,3,3,4,4,5,6,6,7];
   NEXT_LEVEL[1] = [4,5,3,4,4,5,5,6,7,8];
   LAST_LEVEL = NEXT_LEVEL[1].length;
   HUNGRY_LEVEL = [1.5,2,3,5,7,9,11,13,15,17];
   HUNGRY_UP = [4,8,12,16];
   SCORE_UP = [100,150,250,300];
   SCORE_LEVEL = 15;
   DAMAGE_LEVEL = [16,16,8,9,10,11,13,15,17,20];
   SHOW_COUNT = 20;
   eatcount = [0,0,0,0];
   X_SPEED = 1.5;
   Y_SPEED = 1;
   HUNGRY_SHARK = 100;
   score = 0;
   ctenemy = false;
   score_mc.digitset.align = "center";
   score_mc.digitset.number = 0;
   mission1.digitset.align = "center";
   mission2.digitset.align = "center";
   mission3.digitset.align = "center";
   mission4.digitset.align = "center";
   mission1.digitset.number = 0;
   mission2.digitset.number = 0;
   mission3.digitset.number = 0;
   mission4.digitset.number = 0;
   eList = [];
   eList.count = 0;
   hungry = 100;
   hungryBar();
   gameover_mc._visible = false;
   gameover_mc.stop();
   bPos = [{x:297,y:310},{x:157,y:308},{x:74,y:279},{x:430,y:336}];
   pmc_onEnterFrame = function()
   var _loc5_;
   var _loc7_;
   if(random(20) == 0)
   _loc5_ = random(4);
   _loc7_ = random(3) + 1;
   backBoggle(bPos[_loc5_].x,bPos[_loc5_].y,_loc7_);
   hungry -= HUNGRY_LEVEL[getLevel() - 1] / 60;
   hungryBar();
   if(eList.count++ > SHOW_COUNT)
   makeEnemy();
   eList.count = 0;
   if(Key.isDown(37))
   this.xspeed -= X_SPEED;
   if(Key.isDown(39))
   this.xspeed += X_SPEED;
   if(Key.isDown(38))
   this.yspeed -= Y_SPEED;
   if(Key.isDown(40))
   this.yspeed += Y_SPEED;
   if(this.xspeed < 0)
   this._xscale = -100;
   else
   this._xscale = 100;
   var _loc6_ = SPEED_LEVEL[getLevel() - 1];
   this.xspeed *= _loc6_;
   this.yspeed *= _loc6_;
   this._x += this.xspeed;
   this._y += this.yspeed;
   if(this._x > IV.RIGHT)
   this._x = IV.RIGHT;
   this.xspeed = 0;
   else if(this._x < IV.LEFT)
   this._x = IV.LEFT;
   this.xspeed = 0;
   if(this._y > IV.BOTTOM)
   this._y = IV.BOTTOM;
   this.yspeed = 0;
   else if(this._y < IV.TOP)
   this._y = IV.TOP;
   this.yspeed = 0;
   if(this.moveani > 15 - Math.abs(this.xspeed))
   this.moveani = 0;
   playerAni("move",(15 - Math.abs(this.xspeed)) / 2);
   else
   if(this.moveani == undefined)
   this.moveani = 0;
   this.moveani += 1;
   var _loc3_;
   var _loc4_ = 0;
   while(_loc4_ < eList.length)
   _loc3_ = eList[_loc4_];
   if(_loc3_.hitArea.hitTest(this.hitArea))
   if(!_loc3_.shark && getEatLevel() >= _loc3_._currentframe)
   if(_loc3_.item != undefined)
   playerAni("eat");
   useItem(_loc3_.item);
   else
   addScore(SCORE_UP[_loc3_._currentframe - 1]);
   grow(_loc3_._currentframe);
   newBoggle();
   removeEnemy(_loc3_);
   else if(player_mc.item != IV.ITEM_TRANS)
   sm.start(IV.SOUND_HIT,0,1);
   playerAni("damage");
   if(_loc3_.shark)
   new nhn.game.Shock(_root,10,1);
   hungry -= HUNGRY_SHARK;
   hungryBar();
   newBoggle();
   else
   new nhn.game.Shock(_root,5,1);
   hungry -= DAMAGE_LEVEL[getLevel() - 1];
   hungryBar();
   newBoggle();
   if(!_loc3_.high)
   if(_loc3_.type == 3)
   _loc3_.speedChange(true);
   else if(_loc3_.shark)
   _loc3_.speedChange(false);
   _loc4_ = _loc4_ + 1;
   if(hungry < 0)
   onGameOver();
   };
   player_mc.xspeed = 0;
   player_mc.yspeed = 0;
   gameover_listener = {};
   gameover_listener.onKeyDown = gameover_listener.onMouseDown = function()
   var _loc2_ = Key.getCode();
   if(_loc2_ != 38 && _loc2_ != 40 && _loc2_ != 37 && _loc2_ != 39)
   nhn.game.Input.removeListener(this);
   startGame();
   };
   c_listener = {};
   c_listener.time = getTimer();
   c_listener.onMouseDown = function()
   this.time = getTimer();
   };
   c_listener.onMouseUp = function()
   if(getTimer() - this.time > 5000)
   sm.start(IV.SOUND_ITEM,0,1);
   ctenemy = !ctenemy;
   if(ctenemy)
   player_mc._alpha = 50;
   else
   player_mc._alpha = 100;
   this.onMouseUp = function()
   sm.start(IV.SOUND_ITEM,0,1);
   player_mc.item = IV.ITEM_TRANS;
   this.onMouseUp = undefined;
   };
   };
   nhn.game.Input.addListener(c_listener);
   startGame();

/* ----- unconditional / else ----- */
   if(eval("\x01") != 744)
   set("\x01",eval("\x01") - 362);

/* ============= end de-flattened blocks ============= */
