(function(){
  const API_URL = "https://api.robbiemed.org/chat";

  const bubble = document.getElementById("poChatBubble");
  const panel  = document.getElementById("poChatPanel");
  const closeB = document.getElementById("poChatClose");
  const resetB = document.getElementById("poChatReset");
  const bodyEl = document.getElementById("poChatBody");
  const form   = document.getElementById("poChatForm");
  const input  = document.getElementById("poChatInput");
  const sendB  = document.getElementById("poChatSend");

  if(!bubble || !panel || !form || !bodyEl || !input || !sendB) return;

  bubble.type = "button";

  let previous_response_id = localStorage.getItem("po_previous_response_id") || null;

  function addMsg(text, who){
    const div = document.createElement("div");
    div.className = "poChatMsg " + (who === "user" ? "poChatUser" : "poChatBot");
    div.textContent = text;
    bodyEl.appendChild(div);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function openChat(){
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    input.focus();

    if (!bodyEl.dataset.greeted){
      addMsg("Hi — tell me what you’re tolerating by mouth, whether you have a PEG or PEG-J (if applicable), and what symptoms are limiting you (nausea, vomiting, constipation, pain, reflux).", "bot");
      bodyEl.dataset.greeted = "1";
    }
  }

  function closeChat(){
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  function formatStructured(r){
    const lines = [];
    if (r.summary) lines.push(r.summary.trim());

    if (Array.isArray(r.plan_bullets) && r.plan_bullets.length){
      lines.push("\nWhat to try today:");
      r.plan_bullets.forEach(b => lines.push("• " + b));
    }
    if (Array.isArray(r.monitor_bullets) && r.monitor_bullets.length){
      lines.push("\nWhat to monitor:");
      r.monitor_bullets.forEach(b => lines.push("• " + b));
    }
    if (Array.isArray(r.when_to_call_clinic) && r.when_to_call_clinic.length){
      lines.push("\nWhen to call your clinic/GI team:");
      r.when_to_call_clinic.forEach(b => lines.push("• " + b));
    }
    if (Array.isArray(r.red_flags) && r.red_flags.length){
      lines.push("\nSeek urgent care now if:");
      r.red_flags.forEach(b => lines.push("• " + b));
    }
    if (r.disclaimer) lines.push("\n" + r.disclaimer.trim());
    return lines.join("\n");
  }

  async function send(userText){
    addMsg(userText, "user");
    sendB.disabled = true;
    input.disabled = true;

    try{
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText, previous_response_id }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Request failed");

      if (data.previous_response_id){
        previous_response_id = data.previous_response_id;
        localStorage.setItem("po_previous_response_id", previous_response_id);
      }

      if (data.result && typeof data.result === "object"){
        addMsg(formatStructured(data.result), "bot");
      } else if (typeof data.text === "string" && data.text.trim()){
        addMsg(data.text, "bot");
      } else if (typeof data.raw_text === "string" && data.raw_text.trim()){
        addMsg(data.raw_text, "bot");
      } else {
        addMsg("(No response returned.)", "bot");
      }
    } catch(e){
      addMsg("Error: " + (e?.message || String(e)), "bot");
      console.log(e);
    } finally {
      sendB.disabled = false;
      input.disabled = false;
      input.focus();
    }
  }

  bubble.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (panel.classList.contains("open")) closeChat();
    else openChat();
  });

  panel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  if(closeB) closeB.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeChat();
  });

  if(resetB) resetB.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    previous_response_id = null;
    localStorage.removeItem("po_previous_response_id");
    addMsg("Conversation reset.", "bot");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    input.value = "";
    send(t);
  });

  document.addEventListener("click", () => {
    if (!panel.classList.contains("open")) return;
    closeChat();
  });
})();
