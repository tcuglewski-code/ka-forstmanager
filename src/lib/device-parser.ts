/**
 * Device Parser - Parses User-Agent strings for device tracking (Sprint KK)
 * Used for session management and device list display
 */

interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'app';
  deviceName: string;
  browser: string;
  os: string;
}

/**
 * Parse User-Agent string to extract device information
 */
export function parseUserAgent(userAgent: string | null | undefined): DeviceInfo {
  if (!userAgent) {
    return {
      deviceType: 'desktop',
      deviceName: 'Unbekanntes Gerät',
      browser: 'Unbekannt',
      os: 'Unbekannt',
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect device type
  let deviceType: DeviceInfo['deviceType'] = 'desktop';
  if (ua.includes('kochaufforstung') || ua.includes('expo')) {
    deviceType = 'app';
  } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|webos|blackberry|opera mini|iemobile/i.test(userAgent)) {
    deviceType = 'mobile';
  }

  // Detect OS
  let os = 'Unbekannt';
  if (ua.includes('windows nt 10') || ua.includes('windows nt 11')) os = 'Windows';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('chrome os')) os = 'Chrome OS';

  // Detect Browser
  let browser = 'Unbekannt';
  if (ua.includes('kochaufforstung') || ua.includes('expo')) {
    browser = 'Koch Aufforstung App';
  } else if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('msie') || ua.includes('trident/')) browser = 'Internet Explorer';

  // Compose device name
  let deviceName: string;
  if (deviceType === 'app') {
    deviceName = `Koch Aufforstung App (${os})`;
  } else if (deviceType === 'mobile') {
    deviceName = `${browser} auf ${os} (Mobil)`;
  } else if (deviceType === 'tablet') {
    deviceName = `${browser} auf ${os} (Tablet)`;
  } else {
    deviceName = `${browser} auf ${os}`;
  }

  return {
    deviceType,
    deviceName,
    browser,
    os,
  };
}

/**
 * Get device icon based on device type
 */
export function getDeviceIcon(deviceType: string): string {
  switch (deviceType) {
    case 'mobile':
      return '📱';
    case 'tablet':
      return '📲';
    case 'app':
      return '🌲';
    case 'desktop':
    default:
      return '💻';
  }
}

/**
 * Anonymize IP address for GDPR compliance (keep first 3 octets)
 */
export function anonymizeIp(ip: string | null | undefined): string {
  if (!ip) return 'Unbekannt';
  
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  
  // IPv6 - just show first segment
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:xxxx:xxxx`;
  }
  
  return 'Unbekannt';
}
