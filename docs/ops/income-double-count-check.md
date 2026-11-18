# Finding cases that may have counted the household estimate twice (#44)

Before the fix, the quick check's household income estimate ("הכנסה חודשית נטו משוערת של כל הלווים") was
written into borrower 1's net income. In a two-borrower case, borrower 2's income was then added on top of a
figure that already included it.

This query only reads. It lists cases where that may have happened, for a person to review with the client.
Do not subtract or overwrite income automatically: some clients will have replaced the prefilled value with
their own income, and the two numbers can match by chance.

```sql
select
  c.id,
  c.case_number,
  (c.intake_data->'quick_check'->'answers'->>'income')::numeric  as quick_check_household_estimate,
  (c.intake_data->'income'->>'monthlyNetIncome')::numeric        as borrower1_net_income,
  (c.intake_data->'income'->>'b2MonthlyNetIncome')::numeric      as borrower2_net_income
from public.cases c
where c.intake_data->'personal'->>'borrowerCount' = '2'
  and (c.intake_data->'income'->>'b2MonthlyNetIncome')::numeric > 0
  and c.intake_data->'quick_check'->'answers'->>'income' is not null
  and c.intake_data->'income'->>'monthlyNetIncome' = c.intake_data->'quick_check'->'answers'->>'income';
```

A match means borrower 1's income still equals the household estimate. The correction is to ask the client for
borrower 1's own net income and save it through the dashboard income page, which recalculates the total.
