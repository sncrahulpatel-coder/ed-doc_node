export default function getPromptSchema(serviceId, opinion, title = "", title_desc = "") {
  // --- Base structure ---
  const baseSchema = {
    type: "object",
    properties: {
      learning_badge: { type: "array", items: { type: "string" } },
      activity_badge: { type: "array", items: { type: "string" } },
      outcome_badge: { type: "array", items: { type: "string" } },
      engagement_percentage: { type: "integer" },

      // Only strongest per group
      level_list: {
        type: "object",
        properties: {
          Observing: { type: "string" },
          Responding: { type: "string" },
          Initiative: { type: "string" },
          Contributing: { type: "string" }
        },
        required: ["Observing", "Responding", "Initiative", "Contributing"]
      },
      MeSection: {
        type: "object",
        properties: {
          family_moment: { type: "string" },
          special_way: { type: "string" },
          story_spark: { type: "string" },
          tiny_bit: { type: "string" }
        },
      },
      WeSection: {
        type: "object",
        properties: {
          big_idea: { type: "string" },
          my_connection: { type: "string" },
          then_now: { type: "string" },
          just_the_facts: { type: "string" }
        },
      },
       WorldSection: {
        type: "object",
        properties: {
          family_moment: { type: "string" },
          special_way: { type: "string" },
          story_spark: { type: "string" },
          tiny_bit: { type: "string" }
        },
      },
       CommunitySection: {
        type: "object",
        properties: {
          family_moment: { type: "string" },
          special_way: { type: "string" },
          story_spark: { type: "string" },
          tiny_bit: { type: "string" }
        },
      },
       ChallengeSection: {
        type: "object",
        properties: {
          family_moment: { type: "string" },
          special_way: { type: "string" },
          story_spark: { type: "string" },
          tiny_bit: { type: "string" }
        },
      },
       GrowthSection: {
        type: "object",
        properties: {
          family_moment: { type: "string" },
          special_way: { type: "string" },
          story_spark: { type: "string" },
          tiny_bit: { type: "string" }
        },
      },
    },
    additionalProperties: false
  };

  // --- Simpler prompt text ---
  const promptBase = (includeTopic = false, badges_colors) => `

This opinion is written by kids. So keep your choices simple, clear, and not too strict.
Read the student’s opinion ${includeTopic ? "for the topic below " : ""}and fill the schema.



Rules :
- Engagement %: Estimate how much the student is engaged (0–100).
${badges_colors}

If unclear → keep it the lightest shade of their respective colors.

--- Start -----
${includeTopic ? `Student Topic: ${title} (${title_desc})\n\n` : ""}
Student Opinion:
${opinion}
--- End -----

In Output in section, add only thouse fields which are clearly matching. If unsure, leave it with #eeeeee.
but make sure to return all the fields in the JSON.

Output JSON only!
{
  "learning_badge": [],
  "activity_badge": [],
  "outcome_badge": [],
  "engagement_percentage": 0,
  "level_list": {
    "Observing": "#eeeeee",
    "Responding": "#eeeeee",
    "Initiative": "#eeeeee",
    "Contributing": "#eeeeee"
  },
  "MeSection": {
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee"
  },
  "WeSection": {
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee"
  },
  ,
  "WorldSection": {
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee"
  } ,
  "CommunitySection": {
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee"
  } ,
  "ChallengeSection": {
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee"
  },
  "GrowthSection": {
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee",
    "demo" : "#eeeeee"
  }
}`;

  // --- Separated schemas for each service ---
  const schema = {
    SaathAneSangaath_CulturalConnections: {
      schema: baseSchema,
      prompt: promptBase(false, `
- Badges: 
  - Learning → LittleNoticer.png, StoryCatcher.png, WonderAsker.png
  - Activity → QuickSpinner.png, OpenHand.png, ThreadFinder.png
  - Outcome → PlainSpeaker.png, HeartListener.png, NewEye.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - own_words (#22A35D),clear_voice (#3B82F6), fresh_idea (#F97316), first_try(#DC2626)
- We section → Pick strongest only:
  - daily_life (#FACC15), personal_link(#9333EA),small_notice (#92400E),surface_talk (#111827)
      `)
    },
    SaathAneSangaath_CulturalConnections_Exposition: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → StoryKeeper.png, TraditionTracker.png, ValuveSpotter.png
  - Activity → CuriousCollector.png, FamilyListener.png, CarefulChooser.png
  - Outcome → SimpleTeller.png, MemoryPainter.png, LinkMaker.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (#22A35D), special_way (#3B82F6), story_spark (#F97316), tiny_bit (#DC2626)
- Growth section → Pick strongest only:
  - big_idea (#FACC15), my_connection (#9333EA), then_now (#92400E), just_the_facts (#111827)
      `)
    },
    SaathAneSangaath_CulturalConnections_Choice: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → RoleReader.png, ChoiceSpotter.png, EmpathyFinder.png
  - Activity → QuickStepper.png, ActivePlayer.png, BridgeBuilder.png
  - Outcome → VoiceShifter.png, CleanTeller.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- We section → Pick strongest only:
  - fair_choice (#22A35D) , helper_move (#3B82F6), voice_heard #F97316), quick_judge (#DC2626)
- World section → Pick strongest only:
  - feeling_spot (#FACC15),step_inside (#9333EA), both_sides (#92400E), flat_view (#111827)
      `)
    },
    SaathAneSangaath_CulturalConnections_Information_Single: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- We section → Pick strongest only:
  - sharer (#3B82F6), listener (#22C55E), connector (#FACC15),side_track (#DC2626)
- World section → Pick strongest only:
  - question_seeker (#F97316), detail_spotter #9333EA), bridge_builder (#92400E), flat_learner (#111827)
      `)
    },
    SaathAneSangaath_CulturalConnections_Information_group: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - sharer (#3B82F6), listener (#22C55E), connector (#FACC15),side_track (#DC2626)
- World section → Pick strongest only:
  - question_seeker (#F97316), detail_spotter #9333EA), bridge_builder (#92400E), flat_learner (#111827)
      `)
    },
    SaathAneSangaath_FamilyConnection_Activity_1: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FeelOthers.png, IdeaMaker.png, StayConnected.png
  - Activity → BePresent.png, StartFun.png, BuildBonds.png
  - Outcome → LiftTheMood.png, MakeMemories.png, KeepFamilyClose.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
-- We section  → Pick strongest only:
 contributor ( #3B82F6), listener ( #22C55E), connector ( #FACC15), drifter ( #DC2626)

- world section → Pick strongest only:
  questioner ( #F97316), detail_finder ( #9333EA), bridge_builder ( #92400E), silent_passer ( #111827)

      `)
    },
    SaathAneSangaath_NatureConnection_Activity_1: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → StringStarter.png, BigPictureLooker.png, PatienceFinder.png
  - Activity → CarefulNoticer.png, MeaningMaker.png, ThoughtSharer.png
  - Outcome → KeepGrowing.png, NatureConnector.png, ConfidenceSpeader.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  own_words ( #22A35D), clear_voice ( #3B82F6), fresh_thought ( #F97316), first_try ( #DC2626), heart_mirror ( #FACC15)
- We section → Pick strongest only:
daily_life_link ( #9333EA), small_notice ( #92400E), surface_observation ( #111827), personal_connection ( #14B8A6), new_lens ( #EC4899)
      `)
    },
    SaathAneSangaath_NatureConnection_Activity_2: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → SharingLearner.png, BalanceFinder.png, NeedEachOtherInsight.png
  - Activity → KingChooser.png, PeacefulHelper.png, CommunityBuilder.png
  - Outcome → CalmProblemSolver.png, SharingTogether.png, EmpathyBuilder.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
observer_eye ( #22A35D), imaginative_voice ( #3B82F6), curiosity_spark ( #F97316), first_notice ( #DC2626), reflective_thought ( #FACC15)
- We section → Pick strongest only:
  empathy_look ( #9333EA), routine_linker ( #92400E), interaction_starter ( #111827), perspective_tuner ( #14B8A6), care_noticer ( #EC4899)
  - World section → Pick strongest only:  
  life_connector ( #3B82F6), balance_observer ( #22C55E), chain_thinker ( #FACC15), surface_viewer ( #DC2626), home_protector ( #14B8A6)
  - Growth section → Pick strongest only:
  story_builder ( #F97316), thought_expander ( #9333EA), action_mapper ( #92400E), reflective_noticer ( #111827), interdependence_lens ( #EC4899)
  `)
    },
    SaathAneSangaath_NatureConnection_Activity_3: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → SharingLearner.png, BalanceFinder.png, NeedEachOtherInsight.png
  - Activity → KindChooser.png, PeacefulHelper.png, CommunityBuilder.png
  - Outcome → CalmProblemSolver.png, SharingTogether.png, EmpathyBuilder.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
 own_words ( #22A35D), clear_voice ( #3B82F6), fresh_thought ( #F97316), first_try ( #DC2626), heart_mirror ( #FACC15)
- We section → Pick strongest only:
  daily_life_link ( #9333EA), small_notice ( #92400E), surface_observation ( #111827), personal_connection ( #14B8A6), new_lens ( #EC4899)
      `)
    },
    SaathAneSangaath_FamilyConnection_Activity_2: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → SafetShare.png, SeeOthers.png, GrowStrong.png
  - Activity → TalkOpenly.png, ListenWell.png, HelpKindly.png
  - Outcome → BuildTrust.png, StrongerTogether.png, SharedKnowledge.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- We section → Pick strongest only:
  story_sharer ( #3B82F6), gentle_listener ( #22C55E), connector ( #FACC15), side_track ( #DC2626)

- World section → Pick strongest only:
  - fun_spinner ( #F97316), detail_spotter ( #9333EA), celebration_builder ( #92400E), flat_sharer ( #111827)
      `)
    },
    SaathAneSangaath_FamilyConnection_Activity_3: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → NoticeSmallActs.png, SayThanks.png, SeeTheValue.png
  - Activity → WatchClosely.png, SpeakUp.png, CelebrateOthers.png
  - Outcome → SpreadGoodFeelings.png, MakeFamilyFeelSafe.png, BringEveryoneCloser.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- We section → Pick strongest only:
   story_share (Blue #3B82F6), gentle_listener (Green #22C55E), connector (Yellow #FACC15), side_track (Red #DC2626), empathy_builder (Teal #14B8A6)
- World section → Pick strongest only:
  -fun_spinner ( #F97316), detail_spotter ( #9333EA), celebration_builder ( #92400E), flat_sharer ( #111827), imagination_spark (#EC4899)
      `)
    },
    SaathAneSangaath_FamilyConnection_Activity_4: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → SeeBothSides.png, FeelOthers.png, HandleDisagreements.png
  - Activity → AskGently.png, StayCalm.png, FindMiddleGround.png
  - Outcome → KeepPeace.png, BuildTrust.png, WorkAsATeam.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- We section → Pick strongest only:
 story_sharer ( #3B82F6), gentle_listener ( #22C55E), connector ( #FACC15), side_track ( #DC2626), empathy_builder #14B8A6)
- World section → Pick strongest only:
  fun_spinner ( #F97316), detail_spotter ( #9333EA), celebration_builder ( #92400E), flat_sharer ( #111827), imagination_spark ( #EC4899)
      `)
    },
    SaathAneSangaath_FamilyConnection_Activity_5: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → NoticeNeeds.png, QuietHelper.png, CareInAction.png
  - Activity → HelpWithoutAskink.png, MakeItFun.png, GiveTime.png
  - Outcome → BringThanks.png, BuildConnection.png, MakePresenceCount.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    SaathAneSangaath_SocialConnection_Activity_1: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → QuietCaring.png, TrueSharing.png, RespectfulKindness.png
  - Activity → KingnessStarter.png, QuietSupporter.png, ActionSpeaker.png
  - Outcome → TrustBuilder.png, RealConnector.png, SafeFriend.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
detail_noticer ( #22A35D), thought_explorer ( #3B82F6), curiosity_spark ( #F97316), first_try ( #DC2626), pause_reflect ( #FACC15)
- We section → Pick strongest only:
observation_listener ( #9333EA), routine_connector ( #92400E), surface_watcher ( #111827), ripple_linker ( #14B8A6), sharing_builder ( #EC4899)
      `)
    },
    SaathAneSangaath_SocialConnection_Activity_2: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → CarefulLooker.png, WhyFinder.png, CommonGround.png
  - Activity → KindThinker.png, CuriousAsker.png, EncouragingFriend.png
  - Outcome → TeamHelper.png, KindnessSpreader.png, CommunityFriend.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
-layer_noticer ( #22A35D), thought_explorer ( #3B82F6), pattern_spark ( #F97316), first_try ( #DC2626), pause_reflect ( #FACC15)
- We section → Pick strongest only:
 observation_listener ( #9333EA), pattern_connector ( #92400E), surface_watcher ( #111827), atmosphere_linker ( #14B8A6), sharing_builder ( #EC4899)
      `)
    },
    SaathAneSangaath_SocialConnection_Activity_3: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → CommunityFriend.png, CareInAction.png, BraveHelper.png
  - Activity → KingChooser.png, PeacefulHelper.png, CommunityBuilder.png
  - Outcome → TrustedNeighbor.png, TeamBuilder.png, KindnessStarter.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
own_choice ( #22A35D), clear_reasoning ( #3B82F6), fresh_thought ( #F97316), first_try ( #DC2626)
- We section → Pick strongest only:
  ripple_noticer ( #9333EA), perspective_link ( #92400E)
      `)
    },
    SaathAneSangaath_SocialConnection_Activity_4: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → WorldConnector.png, MeaningFinder.png, BigPictureLooker.png
  - Activity → CarefulOberver.png, CommonFinder.png, CuriousQuestioner.png
  - Outcome → GlobalFriend.png, ConnectionBuilder.png, AppreciationSharer.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
detail_noticer ( #22A35D), thought_explorer ( #3B82F6), curiosity_spark ( #F97316), first_try ( #DC2626)
- We section → Pick strongest only:
  connection_listener ( #9333EA), pattern_connector ( #92400E)
- World section → Pick strongest only:
ripple_observer ( #3B82F6), influence_tracker ( #22C55E), ripple_observer ( #3B82F6), influence_tracker ( #22C55E)
- Growth section → Pick strongest only:
reflection_builder ( #F97316), action_mapper ( #9333EA), reflection_builder ( #F97316), action_mapper ( #9333EA)

      `)
    },
    SaathAneSangaath_SocialConnection_Activity_5_group: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → UnderstandingFriend.png, IdeaLinker.png, TeamThinker.png
  - Activity → WelcomingFriend.png, RespectfulSpeaker.png, ProblemSolver.png
  - Outcome → TeamBuilder.png, SharedWinner.png, GroupHelper.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
 reflector ( #0D9488), learner ( #2563EB), courageous_voice ( #F59E0B), explorer ( #10B981)
- We section → Pick strongest only:
connector ( #38BDF8), collaborator ( #22C55E), encourager ( #F97316), balancer ( #9333EA)
- World section → Pick strongest only:
community_builder ( #10B981), problem_solver ( #DC2626), bridge_seeker ( #A855F7), responsible_player ( #FACC15)
- Growth section → Pick strongest only:
  -innovator ( #22D3EE), growth_ambassador ( #F472B6), risk_taker ( #84CC16), deep_thinker ( #111827)
      `)
    },
    Activity_book_SaathAneSangaath_CulturalConnections_Activity_1: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_CulturalConnections_Activity_2: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_CulturalConnections_Activity_4: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_CulturalConnections_Activity_6: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_CulturalConnections_Activity_7: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_FamilyConnections_Activity_1: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_FamilyConnections_Activity_2: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_FamilyConnections_Activity_3: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_FamilyConnections_Activity_4: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_FamilyConnections_Activity_5: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_FamilyConnections_Activity_7: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_NatureConnections_Activity_6: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_SocialConnections_Activity_1: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_SocialConnections_Activity_2: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_SocialConnections_Activity_3: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_SocialConnections_Activity_4: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_SocialConnections_Activity_5: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    },
    Activity_book_SaathAneSangaath_SocialConnections_Activity_6: {
      schema: baseSchema,
      prompt: promptBase(true, `
- Badges: 
  - Learning → FactFinder.png, CultureConnector.png, CuriositySpark.png
  - Activity → QuickSpinner.png, ActiveSharer.png, TeamEcho.png
  - Outcome → ClearTeller.png, StoryShaper.png, FreshAngle.png
  (Pick those that clearly match. Leave empty if unsure.)
- Levels → Pick the strongest one and give its HEX shade:
  - Observing (Green), Responding (Red), Initiative (Orange), Contributing (Blue)
- Me section → Pick strongest only:
  - family_moment (Green), special_way (Blue), story_spark (Orange), tiny_bit (Red)
- Growth section → Pick strongest only:
  - big_idea (Yellow), my_connection (Purple), then_now (Brown), just_the_facts (Black)
      `)
    }
  };

  return schema[serviceId];
}
