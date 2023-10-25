import pandas as pd


df = pd.read_excel("Care Activity Data.xlsx")

print("Unique task", df['Aspect of Practice/ Restricted Activity/ Task'].unique())

print("Unique",df['Clinical/Clinical Support'].unique())

print("Columns", list(df))

column_names = list(df)

occupation_df = pd.read_csv('occupation.csv')

occupation_names = list(occupation_df['Name'])

for each in occupation_names:
    if each not in column_names:
        print("Not matched column name", each)


df.to_csv("cleaned.csv", index=False)
