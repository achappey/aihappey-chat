// timeago.ts
import { register } from "timeago.js";

import nl from "timeago.js/lib/lang/nl";
import fr from "timeago.js/lib/lang/fr";
import de from "timeago.js/lib/lang/de";
import es from "timeago.js/lib/lang/es";
import hu from "timeago.js/lib/lang/hu";
import pl from "timeago.js/lib/lang/pl";
import tr from "timeago.js/lib/lang/tr";
import ru from "timeago.js/lib/lang/ru";
import ja from "timeago.js/lib/lang/ja";
import ro from "timeago.js/lib/lang/ro";
import it from "timeago.js/lib/lang/it";
import vi from "timeago.js/lib/lang/vi";
import th from "timeago.js/lib/lang/th";
import ptBR from "timeago.js/lib/lang/pt_BR";
import da from "timeago.js/lib/lang/da";
import sv from "timeago.js/lib/lang/sv";
import nb from "timeago.js/lib/lang/nb_NO";

export function registerTimeagoLocales() {
  register("nl", nl);
  register("fr", fr);
  register("de", de);
  register("pl", pl);
  register("ro", ro);
  register("hu", hu);
  register("tr", tr);
  register("vi", vi);
  register("ja", ja);
  register("ru", ru);
  register("th", th);
  register("it", it);
  register("es", es);
  register("pt", ptBR);
  register("da", da);
  register("sv", sv);
  register("nb", nb);
}
