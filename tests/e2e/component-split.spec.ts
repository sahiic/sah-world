import { test, expect } from '@playwright/test';

test('extracted community forms, roster and chat preserve their contracts', async ({ page }) => {
  // All community writes are intercepted: never create production records in UI tests.
  const group = {
    id: '11111111-1111-4111-8111-111111111111', name: 'Test halkası',
    description: 'Yerel arayüz testi', group_code: 'ABC123', member_count: 1,
    owner_id: '22222222-2222-4222-8222-222222222222', created_at: '2026-01-01T12:00:00Z',
  };
  let created = false;
  let joined = false;
  let sends = 0;
  await page.route('**/rest/v1/**', async route => {
    const pathname = new URL(route.request().url()).pathname;
    const reply = (data: unknown) => route.fulfill({ json: data });
    if (pathname.endsWith('/get_my_groups')) return reply(created ? [group] : []);
    if (pathname.endsWith('/create_group')) {
      expect(route.request().postDataJSON().group_name).toBe('Test halkası');
      created = true;
      return reply(group.id);
    }
    if (pathname.endsWith('/get_group_roster')) return reply([{
      user_id: group.owner_id, display_name: 'Test üyesi', avatar_url: null,
      xp: 100, streak_current: 3, badges: [], role: 'owner', joined_at: group.created_at,
    }]);
    if (pathname.endsWith('/chat_messages')) return reply([]);
    if (pathname.endsWith('/send_group_message')) {
      sends++;
      return reply({ id: '33333333-3333-4333-8333-333333333333', group_id: group.id,
        sender_id: group.owner_id, content: route.request().postDataJSON().message_content,
        created_at: group.created_at });
    }
    if (pathname.endsWith('/preview_group_by_code')) return reply([group]);
    if (pathname.endsWith('/join_group_by_code')) { joined = true; return reply(group.id); }
    // Auth-independent background reads are irrelevant to this isolated fixture.
    return reply([]);
  });
  await page.goto('/?view=community');
  await page.getByRole('button', { name: 'DEV: Misafir görünümü' }).click();
  await expect(page.locator('.community-empty')).toBeVisible();
  await page.locator('.community-empty').getByRole('button', { name: 'Grup oluştur', exact: true }).click();
  await page.getByRole('dialog').locator('input[name=name]').fill('Test halkası');
  await page.getByRole('button', { name: 'Topluluğu oluştur', exact: true }).click();
  await expect(page.locator('.group-hero h2')).toHaveText('Test halkası');
  await expect(page.locator('.roster')).toContainText('Test üyesi');
  await page.getByRole('tab', { name: 'Grup sohbeti' }).click();
  await expect(page.locator('.message-list')).toContainText('Sohbet henüz sessiz');
  await page.getByRole('textbox', { name: 'Topluluk mesajı' }).fill('Birlikte devam ediyoruz.');
  await page.getByRole('button', { name: 'Gönder', exact: true }).click();
  await expect(page.locator('.message-list')).toContainText('Birlikte devam ediyoruz.');
  await expect(page.getByRole('textbox', { name: 'Topluluk mesajı' })).toHaveValue('');
  expect(sends).toBe(1);
  await page.getByRole('button', { name: 'Kodla katıl', exact: true }).click();
  await page.getByRole('dialog').locator('input[name=code]').fill('ABC123');
  await page.getByRole('button', { name: 'Kodu doğrula', exact: true }).click();
  await expect(page.locator('.group-preview')).toContainText('Test halkası');
  expect(joined).toBe(false);
  await page.getByRole('button', { name: 'Topluluğa güvenle katıl', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(joined).toBe(true);
});
