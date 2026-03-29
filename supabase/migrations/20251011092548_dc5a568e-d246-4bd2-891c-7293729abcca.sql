
-- Delete the 4 specified expense entries
DELETE FROM account_transactions 
WHERE id IN (
  'c9c221f8-1f41-43f5-a1d1-4663cf436c37',  -- Oct 11, Gifts, Rs. 345
  '49d2aba0-cfa3-4fd2-8fac-ab4656ea0006',  -- Oct 11, Salaries, Rs. 1,000
  '477d88e7-557b-4f76-b13b-126721fce780',  -- Oct 08, Gifts, Rs. 7,865
  '564610dd-a36f-4482-9196-508e5c3d9309'   -- Oct 07, Medical, Rs. 2,345
);
