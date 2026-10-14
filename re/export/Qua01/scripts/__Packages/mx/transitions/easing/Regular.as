function §\x04\x05§()
{
   set("\x03",735 % 511 * 5);
   return eval("\x03");
}
var §\x01§ = -217 + "\x04\x05"();
var _loc2_;
while(true)
{
   if(eval("\x01") == 903)
   {
      set("\x01",eval("\x01") - 48);
      §§push(true);
   }
   else if(eval("\x01") == 855)
   {
      set("\x01",eval("\x01") - 89);
      if(§§pop())
      {
         set("\x01",eval("\x01") + 174);
      }
   }
   else if(eval("\x01") == 819)
   {
      set("\x01",eval("\x01") - 393);
      §§push("\x0f");
   }
   else if(eval("\x01") == 350)
   {
      set("\x01",eval("\x01") + 392);
   }
   else if(eval("\x01") == 940)
   {
      set("\x01",eval("\x01") - 198);
   }
   else if(eval("\x01") == 537)
   {
      set("\x01",eval("\x01") + 357);
      if(§§pop())
      {
         set("\x01",eval("\x01") - 43);
      }
   }
   else if(eval("\x01") == 566)
   {
      set("\x01",eval("\x01") - 281);
   }
   else
   {
      if(eval("\x01") == 766)
      {
         set("\x01",eval("\x01") + 174);
         §§push(§§pop() >> (§§pop() | §§pop()));
         break;
      }
      if(eval("\x01") == 764)
      {
         set("\x01",eval("\x01") - 227);
         §§push(!§§pop());
      }
      else if(eval("\x01") == 894)
      {
         set("\x01",eval("\x01") - 43);
      }
      else if(eval("\x01") == 742)
      {
         set("\x01",eval("\x01") + 34);
         §§push(true);
      }
      else if(eval("\x01") == 776)
      {
         set("\x01",eval("\x01") - 358);
         if(§§pop())
         {
            set("\x01",eval("\x01") + 367);
         }
      }
      else if(eval("\x01") == 635)
      {
         set("\x01",eval("\x01") + 184);
         var §§pop() = §§pop();
      }
      else if(eval("\x01") == 426)
      {
         set("\x01",eval("\x01") + 338);
         §§push(eval(§§pop()));
      }
      else
      {
         if(eval("\x01") == 418)
         {
            set("\x01",eval("\x01") + 367);
            break;
         }
         if(eval("\x01") == 785)
         {
            set("\x01",eval("\x01") - 500);
         }
         else
         {
            if(eval("\x01") != 285)
            {
               if(eval("\x01") == 851)
               {
                  set("\x01",eval("\x01") - 679);
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
                  if(!_global.mx.transitions.easing)
                  {
                     _global.mx.transitions.easing = new Object();
                  }
                  §§pop();
                  if(!_global.mx.transitions.easing.Regular)
                  {
                     _loc2_ = mx.transitions.easing.Regular = function()
                     {
                     }.prototype;
                     mx.transitions.easing.Regular = function()
                     {
                     }.easeIn = function(t, b, c, d)
                     {
                        return c * (t /= d) * t + b;
                     };
                     mx.transitions.easing.Regular = function()
                     {
                     }.easeOut = function(t, b, c, d)
                     {
                        return (- c) * (t /= d) * (t - 2) + b;
                     };
                     mx.transitions.easing.Regular = function()
                     {
                     }.easeInOut = function(t, b, c, d)
                     {
                        if((t /= d / 2) < 1)
                        {
                           return c / 2 * t * t + b;
                        }
                        return (- c) / 2 * ((t = t - 1) * (t - 2) - 1) + b;
                     };
                     §§push(ASSetPropFlags(mx.transitions.easing.Regular.prototype,null,1));
                  }
                  §§pop();
                  break;
               }
               if(eval("\x01") == 172)
               {
                  set("\x01",eval("\x01") - 172);
               }
               break;
            }
            set("\x01",eval("\x01") + 350);
            §§push("\x0f");
            §§push(1);
         }
      }
   }
}
