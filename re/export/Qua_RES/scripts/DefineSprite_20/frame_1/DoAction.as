if(enabled)
{
   switch(serviceType)
   {
      case "kr_hangame":
         domain = "http://images.hangame.co.kr";
         break;
      case "kr_naver":
         domain = "http://itemimgs.naver.com";
         break;
      case "cn_ourgame":
         domain = "http://flash.ourgame.com";
         break;
      case "cn_ourgame1":
         domain = "http://flash1.ourgame.com";
         break;
      case "jp_hangame":
         domain = "http://flashweb.hangame.co.jp";
         break;
      case "jp_naver":
         domain = "";
         break;
      case "[etc.Domain]":
         domain = etcDomain;
         break;
      default:
         domain = "";
   }
   if(domain != "" && toURL != "")
   {
      if(_parent._parent._parent._url.indexOf(domain) != 0)
      {
         _parent._parent.unloadMovie();
         getURL(toURL,"");
      }
   }
   this._visible = false;
   stop();
}
else
{
   this.gotoAndStop(2);
}
