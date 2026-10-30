-- ══ Lecture des signalements pour l'admin ════════════════════════
-- La table listing_reports n'accordait que l'INSERT : même un admin
-- ne pouvait pas lire les signalements. On ajoute les droits de lecture
-- et de traitement, réservés à l'admin.

grant select on public.listing_reports to authenticated;

drop policy if exists "Admins can read every report" on public.listing_reports;
create policy "Admins can read every report"
  on public.listing_reports for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can close every report" on public.listing_reports;
create policy "Admins can close every report"
  on public.listing_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());
