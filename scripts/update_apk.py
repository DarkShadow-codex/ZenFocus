import os
import glob
import shutil
import subprocess
import zipfile

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    print("Project root:", root_dir)

    base_apk = os.path.join(root_dir, "ZenFocus.apk")
    backup_apk = os.path.join(root_dir, "ZenFocus-base.bak")
    unaligned_apk = os.path.join(root_dir, "ZenFocus-unaligned.apk")
    aligned_apk = os.path.join(root_dir, "ZenFocus-aligned.apk")
    target_apk = os.path.join(root_dir, "ZenFocus.apk")

    # Find newly exported bundle
    bundle_pattern = os.path.join(root_dir, "mobile", "dist", "_expo", "static", "js", "android", "*.hbc")
    hbc_files = glob.glob(bundle_pattern)
    if not hbc_files:
        raise RuntimeError("No .hbc bundle found in " + bundle_pattern)
    latest_bundle = hbc_files[0]
    print(f"Injecting latest Hermes bundle: {latest_bundle} ({os.path.getsize(latest_bundle)} bytes)")

    with open(latest_bundle, "rb") as f:
        bundle_data = f.read()

    # Backup original APK if not already backed up
    if not os.path.exists(backup_apk):
        shutil.copyfile(base_apk, backup_apk)
        print("Created backup of base APK at:", backup_apk)
    source_apk = backup_apk if os.path.exists(backup_apk) else base_apk

    # Read and patch AndroidManifest.xml
    with zipfile.ZipFile(source_apk, "r") as zin:
        orig_manifest = bytearray(zin.read("AndroidManifest.xml"))

    # Patch versionCode (Attr 1 in <manifest> tag)
    start_tag = b"\x02\x01\x10\x00"
    pos = orig_manifest.find(start_tag)
    if pos != -1:
        # ResXMLTree_attrExt: ns(4), name(4), attrStart(2), attrSize(2), attrCount(2)
        # attrs start at pos + 16
        # Attr 1 (versionCode) data is at pos + 16 + 20 + 16 = pos + 52
        vcode_offset = pos + 52
        import struct
        old_vcode = struct.unpack("<I", orig_manifest[vcode_offset:vcode_offset+4])[0]
        print(f"Patching AndroidManifest.xml versionCode from {old_vcode} to 3 at offset {vcode_offset}")
        orig_manifest[vcode_offset:vcode_offset+4] = struct.pack("<I", 3)

    # Patch versionName in string pool (UTF-16LE)
    old_vname_utf16 = "1.0.1".encode("utf-16le")
    new_vname_utf16 = "1.0.2".encode("utf-16le")
    vname_idx = orig_manifest.find(old_vname_utf16)
    if vname_idx != -1:
        print(f"Patching AndroidManifest.xml versionName from '1.0.1' to '1.0.2' at offset {vname_idx}")
        orig_manifest[vname_idx:vname_idx+len(old_vname_utf16)] = new_vname_utf16

    print(f"Reading from source APK: {source_apk}")
    with zipfile.ZipFile(source_apk, "r") as zin:
        with zipfile.ZipFile(unaligned_apk, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                # Strip old signatures
                if item.filename.startswith("META-INF/") and (
                    item.filename.endswith(".SF")
                    or item.filename.endswith(".RSA")
                    or item.filename.endswith(".DSA")
                    or item.filename.endswith(".MF")
                ):
                    continue
                if item.filename == "assets/index.android.bundle":
                    zout.writestr(item.filename, bundle_data, compress_type=zipfile.ZIP_DEFLATED)
                    print("Updated assets/index.android.bundle")
                elif item.filename == "AndroidManifest.xml":
                    zout.writestr(item.filename, orig_manifest, compress_type=item.compress_type)
                    print("Updated AndroidManifest.xml (versionCode=3, versionName=1.0.2)")
                else:
                    data = zin.read(item.filename)
                    zout.writestr(item.filename, data, compress_type=item.compress_type)

    print(f"Unaligned APK created: {os.path.getsize(unaligned_apk)} bytes")

    # Zipalign
    zipalign_bin = r"C:\Users\dell\AppData\Local\Android\Sdk\build-tools\35.0.0\zipalign.exe"
    print("Running zipalign...")
    subprocess.check_call([zipalign_bin, "-f", "-p", "4", unaligned_apk, aligned_apk])
    print(f"Aligned APK created: {os.path.getsize(aligned_apk)} bytes")

    # Apksigner
    apksigner_bat = r"C:\Users\dell\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat"
    keystore = os.path.join(root_dir, "mobile", "android", "app", "zenfocus-release.keystore")
    java_home = r"c:\Users\dell\jdk-17"

    env = os.environ.copy()
    env["JAVA_HOME"] = java_home
    env["PATH"] = os.path.join(java_home, "bin") + ";" + env.get("PATH", "")

    sign_cmd = [
        "cmd.exe", "/c", apksigner_bat, "sign",
        "--ks", keystore,
        "--ks-pass", "pass:zenfocus123",
        "--ks-key-alias", "zenfocus",
        "--key-pass", "pass:zenfocus123",
        "--v1-signing-enabled", "true",
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        "--v4-signing-enabled", "true",
        "--out", target_apk,
        aligned_apk
    ]
    print("Signing ZenFocus.apk with release keystore (v1, v2, v3, v4)...")
    subprocess.check_call(sign_cmd, env=env)
    print("ZenFocus.apk signed successfully!")

    # Verify signature
    print("Verifying signatures...")
    verify_cmd = [
        "cmd.exe", "/c", apksigner_bat, "verify", "--verbose", target_apk
    ]
    res = subprocess.run(verify_cmd, env=env, capture_output=True, text=True)
    print(res.stdout)
    if res.returncode != 0:
        print("Verification stderr:", res.stderr)
        raise RuntimeError("Signature verification failed!")

    # Dump badging with aapt2
    aapt2_bin = r"C:\Users\dell\AppData\Local\Android\Sdk\build-tools\35.0.0\aapt2.exe"
    print("Verifying APK badging with aapt2...")
    badging_res = subprocess.run([aapt2_bin, "dump", "badging", target_apk], capture_output=True, text=True)
    for line in badging_res.stdout.splitlines()[:6]:
        print("  ", line)

    # Cleanup temporary files
    for tmp in [unaligned_apk, aligned_apk]:
        if os.path.exists(tmp):
            os.remove(tmp)

    print("\n[SUCCESS] Successfully updated ZenFocus.apk!")
    print(f"ZenFocus.apk size: {os.path.getsize(target_apk)} bytes")

if __name__ == "__main__":
    main()
