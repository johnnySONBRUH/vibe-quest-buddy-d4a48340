import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const modePrompts: Record<string, string> = {
  coach: `You are an enthusiastic, supportive AI study coach. Be encouraging but genuine, celebrate wins, empathize with struggles, and give practical tips. Mix humor with wisdom. Speak like a friendly upperclassman.`,
  "study-help": `You are a knowledgeable study tutor. Help explain concepts clearly, suggest study techniques (Pomodoro, spaced repetition, active recall), create mini study plans, and quiz the student. Be patient and thorough.`,
  planner: `You are a productivity and time management expert. Help create schedules, prioritize tasks, break down big goals into actionable steps, and suggest time-blocking strategies. Be structured and actionable.`,
  general: `You are a versatile student life assistant. Answer questions about college life, wellness, social skills, career advice, creative projects, and anything else a student might need. Be friendly and helpful.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, mode = "coach", language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const modeInstructions = modePrompts[mode] || modePrompts.coach;

    const langNames: Record<string, string> = {
      en: "English", zh: "Simplified Chinese", ms: "Bahasa Melayu",
      ko: "Korean", ja: "Japanese", es: "Spanish", fr: "French", ru: "Russian",
    };
    const langName = langNames[language] || "English";

    const systemPrompt = `${modeInstructions}

You are part of QuestUp, a gamified student productivity app.

IMPORTANT: Always respond in ${langName}, regardless of the language the user writes in.

Context about the student:
- Current streak: ${context?.streak || 0} days
- Today's progress: ${context?.completedMissions || 0}/${context?.totalMissions || 5} missions completed
- Total XP: ${context?.totalXp || 0}

Guidelines:
- Use emojis naturally (not excessively)
- Keep responses concise (2-4 sentences for quick questions, longer for detailed help)
- Reference their actual progress when relevant
- Be genuine and supportive`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
