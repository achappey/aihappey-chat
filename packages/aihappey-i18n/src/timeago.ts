// timeago.ts
import { register } from "timeago.js";

import nl from "timeago.js/lib/lang/nl";
import fr from "timeago.js/lib/lang/fr";
import de from "timeago.js/lib/lang/de";
import es from "timeago.js/lib/lang/es";
import ptBR from "timeago.js/lib/lang/pt_BR";

export function registerTimeagoLocales() {
  register("nl", nl);
  register("fr", fr);
  register("de", de);
  register("es", es);
  register("pt", ptBR);
}
