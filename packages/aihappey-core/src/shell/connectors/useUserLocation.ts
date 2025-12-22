import { useAppStore } from "aihappey-state";
import { useEffect } from "react";
import { useGeolocated } from "react-geolocated";

export function useUserLocation(enableUserLocation: boolean) {
    const setAccountLocation = useAppStore((s) => s.setAccountLocation);

    const {
        coords,
        isGeolocationAvailable,
        isGeolocationEnabled,
    } = useGeolocated({
        positionOptions: { enableHighAccuracy: true },
        watchPosition: true,
        userDecisionTimeout: 5000,
        suppressLocationOnMount: !enableUserLocation,
    });

    useEffect(() => {
        if (!enableUserLocation) return;
        if (!isGeolocationAvailable || !isGeolocationEnabled) {
            setAccountLocation(undefined);
            return;
        }

        if (coords) {
            // Build location object and remove null/undefined entries
            const location = Object.fromEntries(
                Object.entries({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    speed: coords?.speed,
                    altitude: coords?.altitude,
                    altitudeAccuracy: coords?.altitudeAccuracy,
                    heading: coords?.heading,
                    accuracy: coords.accuracy,
                }).filter(([_, v]) => v != null) // keep only defined/non-null values
            );

            setAccountLocation(location);
        }

    }, [enableUserLocation, coords, isGeolocationAvailable, isGeolocationEnabled]);
}
