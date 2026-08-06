create policy "Users can select own push token"
  on public.push_tokens for select
  using (auth.uid() = user_id);
