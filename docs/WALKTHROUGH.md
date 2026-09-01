# ASTERA Demo Walkthrough

## 90-second judge walkthrough

### 0:00–0:12 — Establish the problem

Open the portfolio overview and say:

> Premium estates are still run through fragmented chats, spreadsheets, calls, and memory. ASTERA turns that operational noise into one calm, accountable command center.

Point out the estate constellation, portfolio health, open incidents, pending approvals, and privacy indicator.

### 0:12–0:30 — Show the incident

Open **Bali Villa** and focus on the water leak incident. Explain that staff can report a problem using text, photo, or voice, while ASTERA structures the location, affected asset, severity, and immediate containment plan.

Optional interaction: choose **Report incident**, select an input mode, run the analysis, and create the draft.

### 0:30–0:55 — Turn evidence into a decision

Choose **Review vendor quotes**. Compare the two normalized proposals by total cost, arrival time, scope, warranty, and risk. Select the recommended vendor and emphasize that the recommendation is advisory and traceable to evidence.

### 0:55–1:10 — Preserve human authority

Continue to approval. Confirm the authorization statement, record the approval, then use the separate simulated-dispatch checkpoint. The UI records both decisions while clearly stating that no external vendor was contacted.

### 1:10–1:25 — Demonstrate operational depth

Show the dispatch plan, asset context, trusted vendor information, notifications, global search, and audit trail. Explain that every action is scoped by estate and role.

### 1:25–1:30 — Close with the wedge

> ASTERA gives principals oversight without operational noise, while estate teams act faster with evidence, clear authority, and an audit trail.

## Click path

1. Select **Bali Villa** from the estate control.
2. Open the active incident.
3. Select **Review vendor quotes**.
4. Compare both proposals and choose one.
5. Continue to approval.
6. Tick the authorization confirmation.
7. Record the approval.
8. Choose **Record simulated dispatch** and review the synthetic dispatch plan.
9. Open notifications and search to demonstrate supporting workflows.
10. Use **Reset demo** before the next presentation.

## Demo operating notes

- Use a desktop browser at 1440 × 900 when possible; the experience also adapts to mobile.
- Reset the demo before recording or presenting.
- Keep the walkthrough focused on one complete outcome rather than visiting every panel.
- State clearly that demo records and integrations are synthetic.
- Never imply that the prototype moved real money or contacted a real vendor.

## Capture stills

With the local app running, generate a repeatable 1440 × 900 shot sequence:

```bash
npm run capture:stills
```

The ignored `outputs/demo-stills/` directory contains seven numbered PNG files and a manifest recording the browser, viewport, source URL, and synthetic/no-external-action boundary. Use these frames as a recording shot list or submission fallback; they are not evidence of a real vendor dispatch.
