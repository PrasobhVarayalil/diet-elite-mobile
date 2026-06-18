import { AppScreen } from '@/components/ui/AppScreen';
import { CustomerProgramGate } from '@/components/auth/CustomerProgramGate';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/src/context/auth-context';
import { apiGet, apiPut, apiUpload } from '@/src/lib/api-client';
import { apiRoutes } from '@/src/lib/api-routes';
import { isCustomer } from '@/src/lib/user-access';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

type ProfileForm = {
    name: string;
    email: string;
    username: string;
    phone: string;
    photo_url?: string | null;
};

export default function ProfileEditScreen() {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const customerView = isCustomer(user);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form, setForm] = useState<ProfileForm>({ name: '', email: '', username: '', phone: '' });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const result = await apiGet<{ user?: ProfileForm }>(apiRoutes.profile.show);
        if (result.ok && result.data?.user) {
            const profileUser = result.data.user;
            setForm({
                name: profileUser.name ?? '',
                email: profileUser.email ?? '',
                username: profileUser.username ?? '',
                phone: profileUser.phone ?? '',
                photo_url: profileUser.photo_url ?? user?.photo_url ?? null,
            });
        } else if (user) {
            setForm({
                name: user.name,
                email: user.email,
                username: user.username,
                phone: user.phone ?? '',
                photo_url: user.photo_url ?? null,
            });
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    function setField(key: keyof ProfileForm, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function pickPhoto() {
        if (!customerView) {
            return;
        }

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission needed', 'Allow photo library access to upload a profile picture.');
            return;
        }

        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
        });

        if (picked.canceled || !picked.assets[0]) {
            return;
        }

        const asset = picked.assets[0];
        const fileName = asset.fileName ?? `profile-${Date.now()}.jpg`;
        const mimeType = asset.mimeType ?? 'image/jpeg';

        setUploading(true);
        setError(null);
        const result = await apiUpload<{ user?: { photo_url?: string } }>(
            apiRoutes.profile.photo,
            'photo',
            asset.uri,
            fileName,
            mimeType,
        );
        setUploading(false);

        if (result.ok) {
            const photoUrl = result.data?.user?.photo_url ?? form.photo_url;
            setForm((prev) => ({ ...prev, photo_url: photoUrl ?? prev.photo_url }));
            setSuccess('Profile photo updated.');
            await refreshUser();
        } else {
            setError(result.message);
        }
    }

    async function save() {
        setSaving(true);
        setError(null);
        setSuccess(null);
        const result = await apiPut(apiRoutes.profile.update, {
            ...form,
            phone: form.phone.trim() || null,
        });
        setSaving(false);
        if (result.ok) {
            setSuccess('Profile updated.');
            await refreshUser();
        } else {
            setError(result.message);
        }
    }

    return (
        <CustomerProgramGate requireActivePlan={false}>
            <AppScreen
                keyboard
                loading={loading}
                scroll
                showLogo={false}
                subtitle="Account details"
                title="Edit profile"
            >
                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}
                <Card>
                    {customerView ? (
                        <View style={styles.photoSection}>
                            {form.photo_url ? (
                                <Image source={{ uri: form.photo_url }} style={styles.photo} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={styles.photoInitial}>
                                        {(form.name || user?.name || '?').charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            <Pressable disabled={uploading} onPress={() => void pickPhoto()}>
                                <Text style={styles.photoAction}>
                                    {uploading ? 'Uploading…' : 'Change profile photo'}
                                </Text>
                            </Pressable>
                        </View>
                    ) : null}
                    <TextField label="Full name" onChangeText={(v) => setField('name', v)} value={form.name} />
                    <TextField
                        autoCapitalize="none"
                        keyboardType="email-address"
                        label="Email"
                        onChangeText={(v) => setField('email', v)}
                        value={form.email}
                    />
                    <TextField
                        autoCapitalize="none"
                        label="Username"
                        onChangeText={(v) => setField('username', v)}
                        value={form.username}
                    />
                    <TextField
                        keyboardType="phone-pad"
                        label="Phone"
                        onChangeText={(v) => setField('phone', v)}
                        value={form.phone}
                    />
                    <Button label="Save changes" loading={saving} onPress={save} />
                    <Button label="Back" onPress={() => router.back()} variant="secondary" />
                </Card>
            </AppScreen>
        </CustomerProgramGate>
    );
}

const styles = StyleSheet.create({
    error: { color: colors.error },
    success: { color: colors.success },
    photoSection: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    photo: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.border },
    photoPlaceholder: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.brandDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoInitial: { fontSize: 36, fontWeight: '700', color: colors.white },
    photoAction: { fontSize: 15, fontWeight: '600', color: colors.brandDark },
});
