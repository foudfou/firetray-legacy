import os, zipfile

def zip(target, source, env):
    f = zipfile.ZipFile(str(target[0]), 'w', zipfile.ZIP_DEFLATED)
    chdir = None
    try:
        chdir = env['ZIPCHDIR'] + os.sep
    except:
        pass
    for s in source:
        s = str(s)
        if chdir and s.find(chdir) == 0:
            arcname = s[len(chdir):]
        else:
            arcname = s
        f.write(s, arcname)
    f.close()
zipbld = Builder(action = zip)
Export('zipbld')

objs = []
for subdir in ['components', 'chrome']:
    r = SConscript(['%s/SConscript' % subdir])
    objs.extend(r)

env = Environment()
r = env.Install('dist', 'chrome.manifest')
objs.append(r)
r = env.Install('dist', 'install.rdf')
objs.append(r)

r = env.Install('dist/defaults/preferences', 'defaults/preferences/prefs.js')
objs.append(r)

zipenv = Environment(BUILDERS = {'Zip' : zipbld}, ZIPCHDIR = 'dist')
zipenv.Zip('firetray.xpi', objs)

Alias('xpi', 'firetray.xpi')
