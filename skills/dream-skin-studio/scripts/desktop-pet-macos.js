ObjC.import("Cocoa");
ObjC.import("Foundation");

var desktopPetWindow = null;

function option(argv, name) {
  var index = argv.indexOf(`--${name}`);
  if (index < 0 || !argv[index + 1]) throw new Error(`Missing --${name}`);
  return argv[index + 1];
}

function writeReady(path, value) {
  var text = $.NSString.stringWithString(JSON.stringify(value));
  var ok = text.writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null);
  if (!ok) throw new Error("Could not write the desktop-pet ready file.");
}

function commandLineArguments() {
  var source = $.NSProcessInfo.processInfo.arguments;
  var values = [];
  for (var index = 0; index < Number(source.count); index += 1) {
    values.push(String(ObjC.unwrap(source.objectAtIndex(index))));
  }
  return values;
}

function run(argv) {
  argv = commandLineArguments().concat(argv || []);
  var animationPath = option(argv, "animation");
  var displayName = option(argv, "name");
  var readyFile = option(argv, "ready-file");
  var manager = $.NSFileManager.defaultManager;
  if (!manager.fileExistsAtPath(animationPath)) throw new Error("Desktop-pet animation was not found.");

  var app = $.NSApplication.sharedApplication;
  app.setActivationPolicy($.NSApplicationActivationPolicyAccessory);
  app.finishLaunching;
  var visible = $.NSScreen.mainScreen.visibleFrame;
  var width = 168;
  var height = 182;
  var x = visible.origin.x + visible.size.width - width - 28;
  var y = visible.origin.y + 54;
  var rect = $.NSMakeRect(x, y, width, height);

  desktopPetWindow = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
    rect,
    $.NSWindowStyleMaskBorderless,
    $.NSBackingStoreBuffered,
    false
  );
  desktopPetWindow.setOpaque(false);
  desktopPetWindow.setBackgroundColor($.NSColor.clearColor);
  desktopPetWindow.setHasShadow(false);
  desktopPetWindow.setLevel($.NSFloatingWindowLevel);
  desktopPetWindow.setMovableByWindowBackground(true);
  desktopPetWindow.setIgnoresMouseEvents(false);

  var image = $.NSImage.alloc.initWithContentsOfFile(animationPath);
  if (!image) throw new Error("Desktop-pet animation could not be decoded.");
  var imageView = $.NSImageView.alloc.initWithFrame($.NSMakeRect(0, 0, width, height));
  imageView.setImage(image);
  imageView.setImageScaling($.NSImageScaleProportionallyUpOrDown);
  imageView.setAnimates(true);
  desktopPetWindow.setContentView(imageView);
  desktopPetWindow.makeKeyAndOrderFront(null);
  desktopPetWindow.orderFrontRegardless;

  writeReady(readyFile, {
    pid: Number(ObjC.unwrap($.NSProcessInfo.processInfo.processIdentifier)),
    name: displayName,
    animation: animationPath,
    window: { x: x, y: y, width: width, height: height },
    visible: true
  });
  return displayName;
}

function idle() {
  return 1;
}
