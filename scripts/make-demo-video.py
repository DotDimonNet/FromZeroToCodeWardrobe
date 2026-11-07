"""Assemble a silent, annotated walkthrough from captured React screen images.

Usage: python scripts/make-demo-video.py /path/to/demo-frames /path/to/Thread_Walkthrough.mp4
Requires Pillow and ffmpeg. The input screens are explicitly static renders of the
real components with data exported by tools/DemoExport, not a live interaction recording.
"""
from pathlib import Path
import sys, subprocess, textwrap, json
from PIL import Image, ImageDraw, ImageFont, ImageOps

frames=Path(sys.argv[1]); output=Path(sys.argv[2]); work=output.parent/'video-build';work.mkdir(parents=True,exist_ok=True)
fontroot=Path('/usr/share/fonts/truetype/dejavu')
def font(size,bold=False,mono=False):
    name='DejaVuSansMono.ttf' if mono else 'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'
    return ImageFont.truetype(str(fontroot/name),size)
serif=ImageFont.truetype('/usr/share/fonts/opentype/urw-base35/NimbusRoman-Regular.otf',63)
ink='#263f32'; muted='#75816d'; bg='#f4f4ed'; accent='#b86a43'
scenes=[
 ('02-wardrobe.jpg','00','From an idea\nto a useful MVP.',
  [('THE PRODUCT','Organize clothes, discover outfits and give good pieces another chapter.'),('THIS VIDEO','An annotated screen walkthrough of the real React components, using data exported from the tested C# API.'),('VIEWING NOTE','The preview host could not run CoreCLR. These are rendered screens, not a live browser recording.')],12),
 ('01-sign-in.jpg','01','Build the\naccount boundary.',
  [('USER JOURNEY','Register, activate, sign in, recover a password and sign out.'),('HOW IT IS BUILT','ASP.NET Identity, HttpOnly cookies, confirmation tokens, CSRF validation and rate limits.'),('CONFIGURATION','Google, Facebook and SMTP adapters need your real provider credentials.')],15),
 ('02-wardrobe.jpg','02','Model the\nwardrobe.',
  [('START WITH THE NEED','See what you own before buying more.'),('BACKEND','Garment entities carry owner, category, color, season, style, era and availability.'),('PERSISTENCE','Repository interfaces isolate EF Core. SQLite stores the local MVP data.')],13),
 ('03-gallery.jpg','03','Make discovery\neffortless.',
  [('THE INTERFACE','Search and combine category, color, season, style, era and favorite filters.'),('STATE MANAGEMENT','Redux keeps UI preferences. RTK Query loads server data and refreshes it after changes.'),('PHOTOGRAPHY','Eleven bundled CC0 examples. Original sources and authors are recorded in the project.')],13),
 ('04-edit-piece.jpg','04','Ship one\nvertical slice.',
  [('FOLLOW A SAVE','React form → API controller → command handler → repository → database.'),('BUSINESS RULES','The server validates every change and derives ownership from the signed-in user.'),('SMALL DETAILS','Unavailable pieces stay out of suggestions. Request states prevent duplicate clicks.')],15),
 ('05-studio.jpg','05','Turn rules\ninto outfits.',
  [('CHOOSE A MOOD','Season, style, era and color harmony guide the search.'),('DOMAIN LOGIC','The C# engine combines one top, one bottom and shoes, then applies compatibility and ranking rules.'),('CLEAR EXPECTATIONS','Style edits are curated inspiration. The match score is a transparent heuristic.')],16),
 ('06-saved-looks.jpg','06','Save a look.\nShare a little.',
  [('THE RESULT','Named combinations make the next morning easier. The shown look was generated and saved through the real API.'),('SHARING','Create a random public link, copy it or share to social networks.'),('PRIVACY','Only that outfit is shared. Revoking its token invalidates the old link.')],15),
 ('07-community.jpg','07','Keep good\nclothes moving.',
  [('THE STORE','Publish a sale, a loan or a giveaway. Filter the community collection.'),('MVP CHOICE','Reserve a piece and arrange local handover. No online payment or shipping is processed.'),('APPLICATION LAYER','Commands validate prices, condition, ownership and supported listing types.')],14),
 ('08-reservations.jpg','08','Protect the\nlast available piece.',
  [('THE LIFECYCLE','Request → accept → complete. Buyers may cancel; sellers may decline.'),('CONCURRENCY','A transaction and conditional database update allow exactly one successful reservation.'),('VERIFIED BEHAVIOR','Tests exercise simultaneous requests, role restrictions, cancellation and stock release.')],16),
 ('09-profile.jpg','09','Make accounts\nmanageable.',
  [('PROFILE','Update a display name and city, change a password and sign out.'),('LOCAL DEMO','Switch between the sample buyer and seller to test both sides of a reservation.'),('PRODUCTION','Demo access is disabled outside Development. Use a fresh database and your own email service.')],13),
 ('10-mobile.jpg','10','Fit everyday\nscreens.',
  [('RESPONSIVE UI','The same React components adapt the gallery, navigation, forms and sharing circle.'),('ACCESSIBILITY','Labeled fields, keyboard focus, modal focus management and reduced-motion support.'),('VISUAL REVIEW','Desktop and 390 px layouts were inspected. Live browser-to-API testing remains a local deployment check.')],13),
 (None,'11','Validate.\nBuild. Deliver.',
  [('AUTOMATED CHECKS','17 backend tests and 2 frontend tests passed. Both dependency audits reported no known vulnerabilities.'),('GITHUB','CI builds and tests the source, then packages the app. A manual workflow publishes a container image.'),('RUN IT LOCALLY','Install .NET 10 and Node 24. Follow the two commands on the left, then open localhost:3000.')],16)
]
def wrap(draw,text,face,width):
    result=[]
    for paragraph in text.split('\n'):
        line=''
        for word in paragraph.split():
            candidate=(line+' '+word).strip()
            if draw.textlength(candidate,font=face)>width and line:result.append(line);line=word
            else:line=candidate
        result.append(line)
    return result
clips=[];timeline=[];position=0
for index,(shot,step,title,sections,duration) in enumerate(scenes):
    canvas=Image.new('RGB',(1920,1080),bg);d=ImageDraw.Draw(canvas)
    d.text((42,23),'thread',font=ImageFont.truetype('/usr/share/fonts/opentype/urw-base35/NimbusRoman-Bold.otf',47),fill=ink)
    d.text((220,41),'FROM ZERO TO CODE  /  WARDROBE MVP',font=font(16),fill=muted)
    d.text((1440,40),'SILENT WALKTHROUGH',font=font(15,True),fill=muted)
    d.line((40,85,1880,85),fill='#d9dfd0',width=2)
    if shot:
        image=Image.open(frames/shot).convert('RGB');image.thumbnail((1325,910),Image.Resampling.LANCZOS)
        x=40+(1325-image.width)//2;y=113+(910-image.height)//2
        d.rounded_rectangle((x-2,y-2,x+image.width+2,y+image.height+2),radius=8,fill='#cfd9c3')
        canvas.paste(image,(x,y))
    else:
        d.rounded_rectangle((40,127,1360,1015),radius=14,fill='#e8ecdf')
        d.text((95,185),'The architecture',font=serif,fill=ink)
        lines=[('React + Redux Toolkit','Views, UI state and API cache'),('MVC Web API','HTTP, identity and CSRF boundary'),('CQRS application handlers','Separate read and write responsibilities'),('Domain + repositories','Rules and persistence contracts'),('EF Core + SQLite','Local relational data and transactions')]
        y=290
        for label,note in lines:
            d.text((100,y),label,font=font(27,True),fill=ink);d.text((100,y+43),note,font=font(22),fill=muted);y+=100
        d.rounded_rectangle((90,825,1300,960),radius=8,fill=ink)
        d.text((120,848),'npm ci --prefix client',font=font(28,mono=True),fill='#e7eddf')
        d.text((120,902),'npm run dev',font=font(28,mono=True),fill='#e7eddf')
    d.text((1420,130),f'STEP {step}',font=font(16,True),fill=accent)
    y=180
    for line in title.split('\n'):d.text((1420,y),line,font=ImageFont.truetype('/usr/share/fonts/opentype/urw-base35/NimbusRoman-Regular.otf',47),fill=ink);y+=52
    y+=38
    for label,body in sections:
        d.text((1420,y),label,font=font(13,True),fill=accent);y+=30
        for line in wrap(d,body,font(23),440):d.text((1420,y),line,font=font(23),fill=ink);y+=34
        y+=33
    if y>1030:raise RuntimeError(f'Caption overflow on scene {index}: {y}')
    d.rectangle((40,1053,1880,1057),fill='#dce3d1');d.rectangle((40,1053,40+int(1840*(index+1)/len(scenes)),1057),fill=accent)
    png=work/f'{index:02}.png';canvas.save(png)
    clip=work/f'{index:02}.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-loop','1','-i',str(png),'-t',str(duration),'-vf',f'fps=24,fade=t=in:st=0:d=0.25,fade=t=out:st={duration-.25}:d=0.25,format=yuv420p','-c:v','libx264','-preset','fast','-crf','20','-threads','2','-an',str(clip)],check=True)
    clips.append(clip);timeline.append({'start':position,'duration':duration,'step':step,'title':title.replace('\n',' '),'notes':sections});position+=duration
    print(f'Scene {index+1}/{len(scenes)} rendered',flush=True)
concat=work/'concat.txt';concat.write_text(''.join(f"file '{p.name}'\n" for p in clips))
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-an','-movflags','+faststart','-metadata','title=Thread — MVP walkthrough and build notes',str(output)],check=True)
(output.parent/'walkthrough-timeline.json').write_text(json.dumps(timeline,indent=2))
print(f'Created {output} ({position}s, no audio track)',flush=True)
