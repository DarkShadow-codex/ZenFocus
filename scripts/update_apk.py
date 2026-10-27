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
        "--v2-signing-enabled", "true",
        "--v3-signing-enabled", "true",
        "--v4-signing-enabled", "true",
        "--out", target_apk,
        aligned_apk
    ]
    print("Signing ZenFocus.apk with release keystore...")
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

    # Cleanup temporary files
    for tmp in [unaligned_apk, aligned_apk]:
        if os.path.exists(tmp):
            os.remove(tmp)

    print("\n[SUCCESS] Successfully updated ZenFocus.apk!")
    print(f"ZenFocus.apk size: {os.path.getsize(target_apk)} bytes")

if __name__ == "__main__":
    main()
